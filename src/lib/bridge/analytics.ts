/**
 * Bridge analytics — mirrors src/lib/swap/analytics.ts exactly. Tracks
 * only the anonymous, non-sensitive event list the spec allows. Never
 * private keys, seed phrases, wallet signatures, full API responses, or
 * secrets — the payload is allowlist-filtered below so a caller
 * accidentally spreading a larger object can't leak more than these
 * fields, even by mistake. No real analytics provider is wired up — the
 * default sink just logs to the console in development and posts to
 * RobinPulse's own /api/analytics/bridge-event route.
 */
export type BridgeAnalyticsEvent =
  | "quote_requested"
  | "route_selected"
  | "approval_submitted"
  | "bridge_submitted"
  | "bridge_completed"
  | "bridge_failed";

export interface BridgeAnalyticsPayload {
  provider?: string;
  fromChain?: string;
  toChain?: string;
  fromTokenSymbol?: string;
  toTokenSymbol?: string;
  inputUsd?: number;
  outputUsd?: number;
  platformFeeUsd?: number;
  completionTimeSeconds?: number;
  errorCode?: string;
}

type BridgeAnalyticsSink = (event: BridgeAnalyticsEvent, payload: BridgeAnalyticsPayload) => void;

const ALLOWED_KEYS: Array<keyof BridgeAnalyticsPayload> = [
  "provider",
  "fromChain",
  "toChain",
  "fromTokenSymbol",
  "toTokenSymbol",
  "inputUsd",
  "outputUsd",
  "platformFeeUsd",
  "completionTimeSeconds",
  "errorCode",
];

const defaultSink: BridgeAnalyticsSink = (event, payload) => {
  if (import.meta.env.DEV) {
    console.debug(`[bridge analytics] ${event}`, payload);
  }
  if (typeof fetch === "undefined") return;
  fetch("/api/analytics/bridge-event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event, ...payload }),
    keepalive: true,
  }).catch(() => {
    // Analytics is best-effort — never surface a failure to the user.
  });
};

let sink: BridgeAnalyticsSink = defaultSink;

export function setBridgeAnalyticsSink(next: BridgeAnalyticsSink) {
  sink = next;
}

export function trackBridgeEvent(
  event: BridgeAnalyticsEvent,
  payload: BridgeAnalyticsPayload = {},
) {
  const safePayload: BridgeAnalyticsPayload = {};
  for (const key of ALLOWED_KEYS) {
    const value = payload[key];
    if (value !== undefined) {
      (safePayload as Record<string, unknown>)[key] = value;
    }
  }
  sink(event, safePayload);
}
