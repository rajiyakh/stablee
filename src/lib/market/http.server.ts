/**
 * Server-only HTTP core: caching, timeouts, retries with backoff, and a
 * provider status registry. Never imported by client code.
 */

type CacheEntry = { value: unknown; expiresAt: number; storedAt: number };

const cache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 400;

export interface ProviderRuntimeStatus {
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  rateLimited: boolean;
}

const statuses = new Map<string, ProviderRuntimeStatus>();

export function getProviderRuntimeStatus(provider: string): ProviderRuntimeStatus {
  return (
    statuses.get(provider) ?? {
      lastSuccessAt: null,
      lastFailureAt: null,
      lastError: null,
      rateLimited: false,
    }
  );
}

export function recordSuccess(provider: string) {
  const prev = getProviderRuntimeStatus(provider);
  statuses.set(provider, { ...prev, lastSuccessAt: new Date().toISOString(), rateLimited: false });
}

export function recordFailure(provider: string, message: string, rateLimited = false) {
  const prev = getProviderRuntimeStatus(provider);
  statuses.set(provider, {
    ...prev,
    lastFailureAt: new Date().toISOString(),
    lastError: message,
    rateLimited,
  });
}

export class ProviderError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

export interface FetchOptions {
  provider: string;
  cacheKey: string;
  ttlSeconds: number;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
}

export interface FetchResult<T> {
  data: T;
  fetchedAt: string;
  cached: boolean;
  stale: boolean;
}

function readCache<T>(key: string): { entry: CacheEntry; fresh: boolean } | null {
  const entry = cache.get(key);
  if (!entry) return null;
  return { entry, fresh: entry.expiresAt > Date.now() };
}

function writeCache(key: string, value: unknown, ttlSeconds: number) {
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].storedAt - b[1].storedAt)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  cache.set(key, {
    value,
    storedAt: Date.now(),
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch JSON with stale-while-revalidate caching, timeout and backoff. */
export async function fetchJson<T>(url: string, options: FetchOptions): Promise<FetchResult<T>> {
  const cached = readCache<T>(options.cacheKey);
  if (cached?.fresh) {
    return {
      data: cached.entry.value as T,
      fetchedAt: new Date(cached.entry.storedAt).toISOString(),
      cached: true,
      stale: false,
    };
  }

  const retries = options.retries ?? 2;
  const timeoutMs = options.timeoutMs ?? 9000;
  let lastError: ProviderError | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: { accept: "application/json", ...(options.headers ?? {}) },
        signal: controller.signal,
      });

      if (response.status === 429) {
        recordFailure(options.provider, "Rate limit reached", true);
        lastError = new ProviderError("rate_limited", "Rate limit reached", 429);
      } else if (response.status === 404) {
        recordSuccess(options.provider);
        throw new ProviderError("not_found", "Resource not found", 404);
      } else if (!response.ok) {
        lastError = new ProviderError(
          "provider_error",
          `Provider responded with ${response.status}`,
          502,
        );
        recordFailure(options.provider, lastError.message);
      } else {
        const data = (await response.json()) as T;
        writeCache(options.cacheKey, data, options.ttlSeconds);
        recordSuccess(options.provider);
        return { data, fetchedAt: new Date().toISOString(), cached: false, stale: false };
      }
    } catch (error) {
      if (error instanceof ProviderError) {
        if (error.code === "not_found") throw error;
        lastError = error;
      } else if ((error as Error)?.name === "AbortError") {
        lastError = new ProviderError("timeout", "Provider request timed out", 504);
        recordFailure(options.provider, lastError.message);
      } else {
        lastError = new ProviderError("network_error", "Could not reach provider", 502);
        recordFailure(options.provider, lastError.message);
      }
    } finally {
      clearTimeout(timer);
    }

    if (attempt < retries) await sleep(300 * 2 ** attempt);
  }

  // Serve stale cached data rather than fabricating values — clearly marked.
  if (cached) {
    return {
      data: cached.entry.value as T,
      fetchedAt: new Date(cached.entry.storedAt).toISOString(),
      cached: true,
      stale: true,
    };
  }

  throw lastError ?? new ProviderError("unknown", "Unknown provider failure");
}

export function hasCacheEntry(key: string): boolean {
  return cache.has(key);
}

/** Extremely small fixed-window rate limiter for our own API routes. */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
