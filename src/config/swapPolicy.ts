/** Price impact and slippage policy — configurable in one place, not scattered magic numbers. */

export const PRICE_IMPACT_WARN_BPS = 100; // 1% — soft warning
export const PRICE_IMPACT_MAX_BPS = 300; // 3% — blocks execution by default
export const PRICE_IMPACT_EXTREME_BPS = 1000; // 10% — always blocked, no override

export const SLIPPAGE_PRESETS_BPS = [10, 50, 100] as const; // 0.1% / 0.5% / 1.0%
// No numeric default — the swap page defaults slippageBps to null (Auto),
// letting 0x select an appropriate tolerance for the pair. Presets/custom
// values here are only used once a user explicitly overrides Auto.
export const SLIPPAGE_WARN_BPS = 200; // 2% — warn on custom values above this
export const SLIPPAGE_MAX_BPS = 500; // 5% — hard cap on custom slippage

/** No expiry field exists in the 0x response — this is an app-side TTL from fetch time. */
export const QUOTE_TTL_MS = 30_000;
