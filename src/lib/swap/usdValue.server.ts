import { formatUnits } from "viem";
import { getTokenPairs } from "@/lib/market/dexscreener.server";
import { projectConfig } from "@/config/project";
import { USDG_ADDRESS } from "@/config/swapTokens";
import { chainlinkUsdPrice } from "./chainlink.server";
import { fetchZeroExPrice, zeroExConfigured } from "./zeroEx.server";
import { zeroExPriceResponseSchema } from "./schemas";

export type UsdValueSource = "usdg-face-value" | "zeroex-indicative" | "chainlink" | "dexscreener";

export interface UsdValueResult {
  usd: number | null;
  source: UsdValueSource | null;
}

function isUsdg(address: string): boolean {
  return address.toLowerCase() === USDG_ADDRESS.toLowerCase();
}

/**
 * Tiered, chain+address-identified USD pricing — never symbol matching.
 * Tries each tier in order; the first real success wins. All four failing
 * returns { usd: null, source: null } and callers must treat that as
 * "cannot verify," never as "assume it's fine."
 */
export async function resolveUsdValue(
  tokenAddress: string,
  amountBaseUnits: string,
  decimals: number,
): Promise<UsdValueResult> {
  // Tier 1 — USDG face value, no network call.
  if (isUsdg(tokenAddress)) {
    const usd = Number(formatUnits(BigInt(amountBaseUnits), decimals));
    return { usd, source: "usdg-face-value" };
  }

  // Tier 2 — 0x indicative price against USDG.
  if (zeroExConfigured()) {
    try {
      const result = await fetchZeroExPrice({
        sellToken: tokenAddress,
        buyToken: USDG_ADDRESS,
        sellAmount: amountBaseUnits,
      });
      const parsed = zeroExPriceResponseSchema.parse(result.data);
      if (parsed.liquidityAvailable && parsed.buyAmount) {
        const usd = Number(formatUnits(BigInt(parsed.buyAmount), 6));
        if (Number.isFinite(usd) && usd > 0) return { usd, source: "zeroex-indicative" };
      }
    } catch {
      // fall through to the next tier
    }
  }

  // Tier 3 — Chainlink (real, but empty registry until owner-configured).
  const chainlinkPricePerToken = await chainlinkUsdPrice(tokenAddress);
  if (chainlinkPricePerToken !== null) {
    const tokenAmount = Number(formatUnits(BigInt(amountBaseUnits), decimals));
    const usd = tokenAmount * chainlinkPricePerToken;
    if (Number.isFinite(usd) && usd >= 0) return { usd, source: "chainlink" };
  }

  // Tier 4 — DEX Screener, reusing the already-existing Robinhood Mainnet provider.
  try {
    const chainId = projectConfig.dataSources.robinhoodDexScreenerChainId;
    if (chainId) {
      const result = await getTokenPairs(chainId, tokenAddress);
      const top = [...result.data].sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0))[0];
      if (top?.priceUsd) {
        const tokenAmount = Number(formatUnits(BigInt(amountBaseUnits), decimals));
        const usd = tokenAmount * top.priceUsd;
        if (Number.isFinite(usd) && usd >= 0) return { usd, source: "dexscreener" };
      }
    }
  } catch {
    // fall through
  }

  return { usd: null, source: null };
}
