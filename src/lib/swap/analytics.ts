/**
 * Swap analytics — tracks only the non-sensitive event list the spec
 * allows. Never private keys, seed phrases, wallet signatures, full API
 * responses, or secrets — the payload is allowlist-filtered below so a
 * caller accidentally spreading a larger object can't leak more than these
 * fields, even by mistake.
 *
 * No real analytics provider is wired up — the default sink just logs to
 * the console in development. Point `setSwapAnalyticsSink()` at a real
 * provider (PostHog, Segment, etc.) later without touching any call site.
 */
export type SwapAnalyticsEvent =
  | "quote_requested"
  | "quote_successful"
  | "quote_failed"
  | "approval_submitted"
  | "approval_confirmed"
  | "swap_submitted"
  | "swap_confirmed"
  | "swap_reverted";

export interface SwapAnalyticsPayload {
  sellToken?: string;
  buyToken?: string;
  feeToken?: string;
  feeAmount?: string;
  feeUsd?: number;
  transactionHash?: string;
  errorCode?: string;
}

type SwapAnalyticsSink = (event: SwapAnalyticsEvent, payload: SwapAnalyticsPayload) => void;

const ALLOWED_KEYS: Array<keyof SwapAnalyticsPayload> = [
  "sellToken",
  "buyToken",
  "feeToken",
  "feeAmount",
  "feeUsd",
  "transactionHash",
  "errorCode",
];

/**
 * Default sink: posts to RobinPulse's own /api/analytics/swap-event route,
 * which logs to server-side function logs — a real, working destination
 * that needs no third-party analytics account. Fire-and-forget and never
 * throws; a network hiccup here must never break the swap flow itself.
 */
const defaultSink: SwapAnalyticsSink = (event, payload) => {
  if (import.meta.env.DEV) {
    console.debug(`[swap analytics] ${event}`, payload);
  }
  if (typeof fetch === "undefined") return;
  fetch("/api/analytics/swap-event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event, ...payload }),
    keepalive: true,
  }).catch(() => {
    // Analytics is best-effort — never surface a failure to the user.
  });
};

let sink: SwapAnalyticsSink = defaultSink;

export function setSwapAnalyticsSink(next: SwapAnalyticsSink) {
  sink = next;
}

export function trackSwapEvent(event: SwapAnalyticsEvent, payload: SwapAnalyticsPayload = {}) {
  const safePayload: SwapAnalyticsPayload = {};
  for (const key of ALLOWED_KEYS) {
    const value = payload[key];
    if (value !== undefined) {
      (safePayload as Record<string, unknown>)[key] = value;
    }
  }
  sink(event, safePayload);
}
