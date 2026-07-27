import { execFile } from "node:child_process";

import { ProviderError, recordFailure, recordSuccess } from "@/lib/market/http.server";
import type { GmgnChain, GmgnInterval } from "@/types/gmgn";

/**
 * Thin child_process wrapper around the official `gmgn-cli` npm package
 * (GMGNAI/gmgn-skills). Confirmed empirically: the CLI reads `GMGN_API_KEY`
 * directly from its process env — no `config --apply` disk bootstrap is
 * required, so none is done here (simpler and stateless-serverless-safe).
 *
 * All uncertainty about GMGN's transport is isolated to this one file:
 * routes/normalize/UI are built against the confirmed real field names
 * regardless of how this function gets them.
 */

const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_CACHE_ENTRIES = 100;

interface CliCacheEntry {
  value: unknown;
  storedAt: number;
  expiresAt: number;
}

const cache = new Map<string, CliCacheEntry>();

function readCache(key: string): CliCacheEntry | null {
  return cache.get(key) ?? null;
}

function writeCache(key: string, value: unknown, ttlSeconds: number) {
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].storedAt - b[1].storedAt)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  cache.set(key, { value, storedAt: Date.now(), expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function gmgnConfigured(): boolean {
  return Boolean((process.env.GMGN_API_KEY ?? "").trim());
}

/**
 * Maps a child_process failure (thrown by execFile on nonzero exit, signal
 * kill, or timeout) to the app's shared ProviderError taxonomy. The CLI's
 * confirmed real stderr shape on an API failure is a single line:
 *   HTTP <status> code=<n> error=<CODE> message=<text>
 * Anything else (crash, unparseable output, local exec failure) is treated
 * as a generic provider error — the raw message is never forwarded verbatim
 * to the client to avoid leaking local process/path details.
 */
function toProviderError(error: unknown): ProviderError {
  const err = error as {
    killed?: boolean;
    signal?: string | null;
    code?: unknown;
    stderr?: string;
    message?: string;
  };

  if (err?.killed || err?.signal === "SIGTERM") {
    return new ProviderError("timeout", "GMGN request timed out", 504);
  }

  const stderr = typeof err?.stderr === "string" ? err.stderr : "";
  const match = stderr.match(/HTTP\s+(\d+).*?error=(\w+).*?message=([^\n\r]+)/i);
  if (match) {
    const status = Number(match[1]);
    const code = match[2].toUpperCase();
    const message = match[3].trim();

    if (status === 429 || code.includes("RATE")) {
      return new ProviderError("rate_limited", "GMGN rate limit reached", 429);
    }
    if (status === 401 || status === 403 || code.includes("AUTH") || code.includes("KEY")) {
      return new ProviderError("auth_error", "GMGN API key was rejected", 401);
    }
    if (status === 404) {
      return new ProviderError("not_found", "GMGN returned no data for this request", 404);
    }
    return new ProviderError("provider_error", message || "GMGN returned an error", 502);
  }

  if (/GMGN_API_KEY/i.test(stderr)) {
    return new ProviderError("not_configured", "GMGN API key is not configured", 200);
  }

  return new ProviderError("provider_error", "GMGN market data is temporarily unavailable", 502);
}

interface RunArgs {
  args: string[];
  cacheKey: string;
  ttlSeconds: number;
  timeoutMs?: number;
}

interface RunResult<T> {
  data: T;
  fetchedAt: string;
  cached: boolean;
  stale: boolean;
}

async function execGmgnCli(args: string[], timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await new Promise<{ stdout: string }>((resolve, reject) => {
      execFile(
        "npx",
        ["--yes", "gmgn-cli", ...args],
        {
          env: { ...process.env },
          timeout: timeoutMs,
          maxBuffer: 10 * 1024 * 1024,
          windowsHide: true,
          signal: controller.signal,
          // On Windows, `npx` resolves to `npx.cmd`, a batch shim that
          // execFile cannot spawn directly without a shell (fails with
          // ENOENT without shell, or EINVAL if "npx.cmd" is passed as the
          // command with shell:false — both are documented Node/Windows
          // child_process quirks). shell:true is safe here specifically
          // because every arg is an internally-generated literal/enum
          // (chain is always "robinhood", interval is one of five fixed
          // strings, limit is a validated number) — never raw user input.
          shell: process.platform === "win32",
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(Object.assign(error, { stderr }));
            return;
          }
          resolve({ stdout });
        },
      );
    });
    return result.stdout;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Runs one `gmgn-cli` market subcommand with caching and a single retry for
 * transient failures only (never retried: rate limits, auth errors — retrying
 * those aggressively is exactly what the spec forbids). Serves stale cached
 * data on failure rather than surfacing an error when any cache exists.
 */
async function runGmgnCli<T>(options: RunArgs): Promise<RunResult<T>> {
  const cached = readCache(options.cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return {
      data: cached.value as T,
      fetchedAt: new Date(cached.storedAt).toISOString(),
      cached: true,
      stale: false,
    };
  }

  if (!gmgnConfigured()) {
    throw new ProviderError("not_configured", "GMGN API key is not configured", 200);
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = 2;
  let lastError: ProviderError | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const stdout = await execGmgnCli(options.args, timeoutMs);
      const trimmed = stdout.trim();
      if (!trimmed) {
        throw new ProviderError("provider_error", "GMGN returned an empty response", 502);
      }
      const data = JSON.parse(trimmed) as T;
      writeCache(options.cacheKey, data, options.ttlSeconds);
      recordSuccess("gmgn");
      return { data, fetchedAt: new Date().toISOString(), cached: false, stale: false };
    } catch (error) {
      lastError = error instanceof ProviderError ? error : toProviderError(error);
      recordFailure("gmgn", lastError.message, lastError.code === "rate_limited");

      const retryable = lastError.code === "timeout" || lastError.code === "provider_error";
      if (!retryable || attempt === maxAttempts - 1) break;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  if (cached) {
    return {
      data: cached.value as T,
      fetchedAt: new Date(cached.storedAt).toISOString(),
      cached: true,
      stale: true,
    };
  }

  throw lastError ?? new ProviderError("unknown", "Unknown GMGN failure");
}

export interface GmgnQueryOptions {
  chain: GmgnChain;
  interval: GmgnInterval;
  limit: number;
}

/** Raw stdout shape is validated by the caller via gmgnTrendingResponseSchema. */
export function fetchGmgnTrending(options: GmgnQueryOptions): Promise<RunResult<unknown>> {
  return runGmgnCli({
    args: [
      "market",
      "trending",
      "--chain",
      options.chain,
      "--interval",
      options.interval,
      "--limit",
      String(options.limit),
      "--raw",
    ],
    cacheKey: `gmgn:trending:${options.chain}:${options.interval}:${options.limit}`,
    ttlSeconds: 45,
  });
}

/** Raw stdout shape is validated by the caller via gmgnHotSearchesResponseSchema. */
export function fetchGmgnHotSearches(options: GmgnQueryOptions): Promise<RunResult<unknown>> {
  return runGmgnCli({
    args: [
      "market",
      "hot-searches",
      "--chain",
      options.chain,
      "--interval",
      options.interval,
      "--limit",
      String(options.limit),
      "--raw",
    ],
    cacheKey: `gmgn:hot-searches:${options.chain}:${options.interval}:${options.limit}`,
    ttlSeconds: 45,
  });
}
