import { swapTokens, USDG_ADDRESS } from "@/config/swapTokens";

/**
 * Pure, client-safe fee math — no env reads here (process.env.* is not
 * available in the browser bundle for non-VITE_ vars). The server-side
 * env-configurable override lives in feeConfig.server.ts; these are the
 * spec's stated defaults, used directly by the client for display/preflight
 * math against numbers the server has already returned in a quote.
 */
export const FEE_BPS_DEFAULT = 10;
/** Hardcoded safety ceiling — never raised by an env var, only lowered/set below it. */
export const FEE_BPS_MAX = 30;
export const MIN_SWAP_USD_DEFAULT = 20;
export const MIN_FEE_USD = 0.02;

/** Clamps to [0, FEE_BPS_MAX] — a caller can never push the fee above the hardcoded cap. */
export function computeSwapFeeBps(overrideBps?: number): number {
  const raw = overrideBps ?? FEE_BPS_DEFAULT;
  if (!Number.isFinite(raw)) return FEE_BPS_DEFAULT;
  return Math.max(0, Math.min(FEE_BPS_MAX, raw));
}

export function meetsMinimumSwap(
  sellUsd: number | null,
  minSwapUsd = MIN_SWAP_USD_DEFAULT,
): boolean {
  return sellUsd !== null && Number.isFinite(sellUsd) && sellUsd >= minSwapUsd;
}

export function meetsMinimumFee(feeUsd: number | null): boolean {
  return feeUsd !== null && Number.isFinite(feeUsd) && feeUsd >= MIN_FEE_USD;
}

function isStablecoin(address: string): boolean {
  return address.toLowerCase() === USDG_ADDRESS.toLowerCase();
}

/**
 * Fee-token priority, exactly: (1) USDG if it's buy or sell, (2) another
 * verified stablecoin if configured and involved, (3) buyToken, (4)
 * sellToken. Never an unrelated third token — the return value is always
 * either sellToken or buyToken (0x requires swapFeeToken to be one of them).
 */
export function selectFeeToken(sellToken: string, buyToken: string): string {
  if (isStablecoin(sellToken)) return sellToken;
  if (isStablecoin(buyToken)) return buyToken;

  const otherStable = swapTokens.find(
    (t) =>
      t.isStablecoin &&
      (t.address.toLowerCase() === sellToken.toLowerCase() ||
        t.address.toLowerCase() === buyToken.toLowerCase()),
  );
  if (otherStable) return otherStable.address;

  return buyToken;
}
