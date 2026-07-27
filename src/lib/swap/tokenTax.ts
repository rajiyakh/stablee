import type { ZeroExQuoteResponse, ZeroExPriceResponse } from "./schemas";

export interface TokenTaxWarning {
  hasTax: boolean;
  maxBps: number;
  sellTaxBps: number | null;
  buyTaxBps: number | null;
  transferTaxBps: number | null;
}

const TAX_WARNING_THRESHOLD_BPS = 1;

function parseTaxBps(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * 0x's tokenMetadata carries real fee-on-transfer/buy-sell-tax data when the
 * provider detected it — never estimated or guessed here, only read through.
 * A quote with no tokenMetadata (or all-zero/absent tax fields) reports
 * hasTax: false, not "safe" — the absence of data is not a safety claim.
 */
export function detectTokenTax(
  response: ZeroExQuoteResponse | ZeroExPriceResponse,
): TokenTaxWarning | null {
  if (!response.liquidityAvailable) return null;
  const meta = response.tokenMetadata;
  if (!meta) return null;

  const sellTaxBps = parseTaxBps(meta.sellToken?.sellTaxBps);
  const buyTaxBps = parseTaxBps(meta.buyToken?.buyTaxBps);
  const transferTaxBps = parseTaxBps(
    meta.sellToken?.transferTaxBps ?? meta.buyToken?.transferTaxBps,
  );

  const maxBps = Math.max(sellTaxBps ?? 0, buyTaxBps ?? 0, transferTaxBps ?? 0);

  return {
    hasTax: maxBps >= TAX_WARNING_THRESHOLD_BPS,
    maxBps,
    sellTaxBps,
    buyTaxBps,
    transferTaxBps,
  };
}
