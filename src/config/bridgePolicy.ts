/** Bridge quote/route policy — configurable in one place, not scattered magic numbers. Mirrors swapPolicy.ts. */

/** No expiry field is guaranteed from every provider — this is an app-side TTL from fetch time. */
export const BRIDGE_QUOTE_TTL_MS = 30_000;

export const BRIDGE_PRICE_IMPACT_WARN_PERCENT = 1; // 1% — soft warning
export const BRIDGE_PRICE_IMPACT_MAX_PERCENT = 3; // 3% — blocks execution by default

export const BRIDGE_SLIPPAGE_PRESETS_BPS = [10, 50, 100] as const; // 0.1% / 0.5% / 1.0%
export const BRIDGE_SLIPPAGE_MAX_BPS = 500; // 5% — hard cap on custom slippage

/** Cap on how many ranked routes the quote endpoint returns to the client. */
export const MAX_ROUTES_RETURNED = 10;

/** How long a provider's cached supported-chains/tokens list is trusted before re-fetching. */
export const SUPPORT_CACHE_TTL_MS = 10 * 60_000;
