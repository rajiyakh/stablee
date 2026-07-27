import { randomUUID } from "node:crypto";

import { ProviderError, recordFailure, recordSuccess } from "@/lib/market/http.server";
import type { GmgnChain, GmgnInterval } from "@/types/gmgn";

/**
 * Direct HTTP client for GMGN's OpenAPI (openapi.gmgn.ai). Previously this
 * spawned the official `gmgn-cli` npm package as a child process — that
 * worked in local dev but broke GMGN market data in production in two
 * independent ways: `npx gmgn-cli` needs `npx` on PATH plus live npm-registry
 * access, neither reliably present in a Vercel serverless function's
 * execution sandbox; and switching to invoking the installed package's file
 * directly (`node <resolved path>`) still failed, because Nitro's bundler
 * only traces/copies files that are statically imported — a path only ever
 * computed at runtime (require.resolve + execFile) never makes it into the
 * deployed function bundle. A plain HTTP call has neither problem.
 *
 * The auth scheme and endpoint paths below were extracted directly from
 * gmgn-cli's own installed source (node_modules/gmgn-cli/dist/client/
 * OpenApiClient.js, signer.js) and confirmed live against the real API:
 *   - Market-data endpoints use "Exist" auth: an X-APIKEY header plus
 *     timestamp + client_id (a random UUID) as query params. No request
 *     signing needed — that's only for swap/order/portfolio-holdings
 *     endpoints, which this app never calls.
 *   - GET /v1/market/rank (trending) double-wraps: the outer OpenAPI-gateway
 *     envelope `{code, data}` contains a second `{code, data: {rank},
 *     message, reason}` envelope — this app's schemas were built against
 *     that inner envelope (confirmed against real captured data), so only
 *     the outer layer is unwrapped here.
 *   - POST /v1/market/hot_searches wraps once: `{code, data: [...blocks],
 *     message, reason}` — data is the bare array this app's schema expects.
 *   - A gateway-level failure (auth, rate limit) returns `{code, error,
 *     message}` with no `data` at all, and a non-2xx HTTP status.
 *
 * All uncertainty about GMGN's transport is isolated to this one file:
 * routes/normalize/UI are built against the confirmed real field names
 * regardless of how this function gets them.
 */
const OPENAPI_HOST = "https://openapi.gmgn.ai";
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

function buildAuthQuery(): Record<string, string> {
  return {
    timestamp: String(Math.floor(Date.now() / 1000)),
    client_id: randomUUID(),
  };
}

/**
 * Maps a gateway-level failure response to the app's shared ProviderError
 * taxonomy. Confirmed live: an invalid key returns HTTP 401 with body
 * `{code: 401, error: "AUTH_KEY_INVALID", message: "api key invalid"}` — the
 * raw message is never forwarded verbatim to the client to avoid leaking
 * upstream implementation details.
 */
function toProviderError(status: number, body: unknown): ProviderError {
  const parsed = body as { error?: unknown; message?: unknown } | null;
  const code = typeof parsed?.error === "string" ? parsed.error.toUpperCase() : "";
  const message = typeof parsed?.message === "string" ? parsed.message : "";

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

interface RunArgs {
  path: string;
  method: "GET" | "POST";
  query?: Record<string, string>;
  body?: unknown;
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

async function callGmgnOpenApi(options: RunArgs, timeoutMs: number): Promise<unknown> {
  const apiKey = (process.env.GMGN_API_KEY ?? "").trim();
  const query = new URLSearchParams({ ...options.query, ...buildAuthQuery() });
  const url = `${OPENAPI_HOST}${options.path}?${query.toString()}`;
  const bodyStr = options.body !== undefined ? JSON.stringify(options.body) : undefined;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: options.method,
      headers: { "X-APIKEY": apiKey, "Content-Type": "application/json" },
      body: bodyStr,
      signal: controller.signal,
    });

    const json = (await response.json().catch(() => null)) as {
      code?: number;
      data?: unknown;
    } | null;

    if (!response.ok || !json || json.code !== 0) {
      throw toProviderError(response.status, json);
    }
    return json.data;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Runs one GMGN OpenAPI call with caching and a single retry for transient
 * failures only (never retried: rate limits, auth errors — retrying those
 * aggressively is exactly what the spec forbids). Serves stale cached data
 * on failure rather than surfacing an error when any cache exists.
 */
async function runGmgnQuery<T>(options: RunArgs): Promise<RunResult<T>> {
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
      const data = (await callGmgnOpenApi(options, timeoutMs)) as T;
      writeCache(options.cacheKey, data, options.ttlSeconds);
      recordSuccess("gmgn");
      return { data, fetchedAt: new Date().toISOString(), cached: false, stale: false };
    } catch (error) {
      lastError =
        error instanceof ProviderError
          ? error
          : (error as { name?: string })?.name === "AbortError"
            ? new ProviderError("timeout", "GMGN request timed out", 504)
            : new ProviderError(
                "provider_error",
                "GMGN market data is temporarily unavailable",
                502,
              );
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

/** Response shape is validated by the caller via gmgnTrendingResponseSchema. */
export function fetchGmgnTrending(options: GmgnQueryOptions): Promise<RunResult<unknown>> {
  return runGmgnQuery({
    path: "/v1/market/rank",
    method: "GET",
    query: {
      chain: options.chain,
      interval: options.interval,
      limit: String(options.limit),
    },
    cacheKey: `gmgn:trending:${options.chain}:${options.interval}:${options.limit}`,
    ttlSeconds: 45,
  });
}

/** Response shape is validated by the caller via gmgnHotSearchesResponseSchema. */
export function fetchGmgnHotSearches(options: GmgnQueryOptions): Promise<RunResult<unknown>> {
  return runGmgnQuery({
    path: "/v1/market/hot_searches",
    method: "POST",
    body: {
      params: [
        {
          label: "hot-search",
          chain: options.chain,
          interval: options.interval,
          limit: options.limit,
        },
      ],
    },
    cacheKey: `gmgn:hot-searches:${options.chain}:${options.interval}:${options.limit}`,
    ttlSeconds: 45,
  });
}
