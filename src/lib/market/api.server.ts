import { z } from "zod";
import { ProviderError, rateLimit } from "./http.server";
import type { ApiEnvelope, ProviderId } from "./types";

export const ATTRIBUTION: Record<ProviderId, string> = {
  coingecko: "Market data by CoinGecko",
  dexscreener: "DEX market data by DEX Screener",
  geckoterminal: "Pool data by GeckoTerminal",
  gmgn: "Robinhood Mainnet market data by GMGN",
  zeroex: "Swap quotes by 0x",
  verified: "Owner-verified registry",
  blockscout: "On-chain holdings by Blockscout",
  bridge: "Cross-chain bridge routes aggregated by RobinPulse",
  lifi: "Bridge routes by LI.FI",
  relay: "Bridge routes by Relay",
  across: "Bridge routes by Across",
  gaszip: "Gas refuel by Gas.zip",
};

export function envelope<T>(
  provider: ProviderId,
  result: { data: T; fetchedAt: string; cached: boolean; stale: boolean },
): ApiEnvelope<T> {
  return {
    data: result.data,
    provider,
    fetchedAt: result.fetchedAt,
    stale: result.stale,
    cached: result.cached,
    error: null,
    attribution: ATTRIBUTION[provider],
  };
}

export function jsonOk<T>(body: ApiEnvelope<T>, maxAge = 30): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${maxAge}, stale-while-revalidate=120`,
    },
  });
}

export function jsonError(provider: ProviderId, error: unknown): Response {
  let code = "unknown";
  let message = "Data temporarily unavailable";
  let status = 502;

  if (error instanceof ProviderError) {
    code = error.code;
    status = error.status;
    message =
      error.code === "rate_limited"
        ? "Provider rate limit reached. Please retry shortly."
        : error.code === "timeout"
          ? "The provider did not respond in time."
          : error.code === "not_found"
            ? "No provider record found for this request."
            : error.code === "rejected"
              ? error.message
              : "Data temporarily unavailable from the provider.";
  } else if (error instanceof z.ZodError) {
    code = "invalid_provider_response";
    message = "The provider returned an unexpected response shape.";
  }

  const body: ApiEnvelope<never> = {
    data: null,
    provider,
    fetchedAt: null,
    stale: false,
    cached: false,
    error: { code, message },
    attribution: ATTRIBUTION[provider],
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function invalidParams(provider: ProviderId): Response {
  const body: ApiEnvelope<never> = {
    data: null,
    provider,
    fetchedAt: null,
    stale: false,
    cached: false,
    error: { code: "invalid_params", message: "The request parameters are not valid." },
    attribution: ATTRIBUTION[provider],
  };
  return new Response(JSON.stringify(body), {
    status: 400,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/** For exact-required-copy business-rule failures (e.g. "price impact too severe") that jsonError's generic ProviderError-code mapping would otherwise overwrite. */
export function customError(
  provider: ProviderId,
  code: string,
  message: string,
  status = 400,
): Response {
  const body: ApiEnvelope<never> = {
    data: null,
    provider,
    fetchedAt: null,
    stale: false,
    cached: false,
    error: { code, message },
    attribution: ATTRIBUTION[provider],
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function notConfigured(provider: ProviderId, message: string): Response {
  const body: ApiEnvelope<never> = {
    data: null,
    provider,
    fetchedAt: null,
    stale: false,
    cached: false,
    error: { code: "not_configured", message },
    attribution: ATTRIBUTION[provider],
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function guard(
  request: Request,
  bucket: string,
  limit = 90,
  windowMs = 60_000,
): Response | null {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anon";
  if (!rateLimit(`${bucket}:${ip}`, limit, windowMs)) {
    return new Response(
      JSON.stringify({
        data: null,
        error: { code: "rate_limited", message: "Too many requests. Please slow down." },
      }),
      { status: 429, headers: { "content-type": "application/json" } },
    );
  }
  return null;
}

export const queryString = (request: Request) => new URL(request.url).searchParams;

export const searchQuerySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[\w .,:$/@#-]+$/);

export const addressSchema = z
  .string()
  .trim()
  .min(6)
  .max(120)
  .regex(/^[a-zA-Z0-9:_-]+$/);

export const chainSchema = z
  .string()
  .trim()
  .min(1)
  .max(48)
  .regex(/^[a-z0-9_-]+$/i);
