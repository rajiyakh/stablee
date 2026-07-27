import type { ScoredMarket, TrendingCoin } from "@/lib/market/types";
import { RISK_FLAG_LABELS } from "@/lib/market/types";
import { formatPercent, formatUsd } from "@/lib/market/format";

export type SummaryCategory = "momentum" | "volume" | "risk";

export interface AutomatedSummary {
  id: string;
  asset: { symbol: string; name: string; href: { to: string; params: Record<string, string> } };
  dataProvider: string;
  dataTimestamp: string;
  headline: string;
  metrics: Array<{ label: string; value: string }>;
  category: SummaryCategory;
  disclaimer: string;
}

const DISCLAIMER =
  "Automatically generated from live provider data. Not investment advice and not a prediction.";

/**
 * Deterministic, template-based summaries derived only from fields already
 * present on live CoinGecko / DEX Screener responses. No model inference,
 * no invented numbers — every value here traces to a real API field.
 */
export function buildAutomatedSummaries(
  trending: TrendingCoin[],
  chainMarkets: ScoredMarket[],
  generatedAt: string,
): AutomatedSummary[] {
  const coinSummaries: AutomatedSummary[] = trending.slice(0, 6).map((coin) => {
    const change = coin.priceChangePercentage24h;
    const direction = change === null ? "moved" : change >= 0 ? "gained" : "declined";
    return {
      id: `coin:${coin.id}`,
      asset: {
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        href: { to: "/coin/$coinId", params: { coinId: coin.id } },
      },
      dataProvider: "CoinGecko",
      dataTimestamp: generatedAt,
      headline: `${coin.name} ${direction} ${formatPercent(change)} over 24h, currently trading at ${formatUsd(coin.priceUsd)}${coin.marketCapRank ? `, ranked #${coin.marketCapRank} by market cap` : ""}.`,
      metrics: [
        { label: "Price", value: formatUsd(coin.priceUsd) },
        { label: "24h change", value: formatPercent(change) },
        { label: "Market cap rank", value: coin.marketCapRank ? `#${coin.marketCapRank}` : "—" },
      ],
      category: "momentum",
      disclaimer: DISCLAIMER,
    };
  });

  const chainSummaries: AutomatedSummary[] = chainMarkets.slice(0, 6).map((entry) => {
    const symbol = entry.market.baseToken.symbol ?? "Unknown";
    const quote = entry.market.quoteToken.symbol ?? "?";
    const topRisk = entry.risks[0];
    return {
      id: `dex:${entry.market.chainId}:${entry.market.pairAddress}`,
      asset: {
        symbol,
        name: entry.market.baseToken.name ?? symbol,
        href: {
          to: "/token/$chainId/$address",
          params: { chainId: entry.market.chainId, address: entry.market.baseToken.address },
        },
      },
      dataProvider: entry.market.source === "geckoterminal" ? "GeckoTerminal" : "DEX Screener",
      dataTimestamp: generatedAt,
      headline: `${symbol}/${quote} shows a trend score of ${entry.trendScore !== null ? entry.trendScore.toFixed(1) : "insufficient data"} on ${entry.market.liquidityUsd !== null ? formatUsd(entry.market.liquidityUsd, { compact: true }) : "unknown"} liquidity.${topRisk ? ` Flagged: ${RISK_FLAG_LABELS[topRisk]}.` : ""}`,
      metrics: [
        {
          label: "Trend score",
          value: entry.trendScore !== null ? entry.trendScore.toFixed(1) : "—",
        },
        { label: "Liquidity", value: formatUsd(entry.market.liquidityUsd, { compact: true }) },
        { label: "24h volume", value: formatUsd(entry.market.volume.h24, { compact: true }) },
      ],
      category: entry.risks.length > 0 ? "risk" : "volume",
      disclaimer: DISCLAIMER,
    };
  });

  return [...coinSummaries, ...chainSummaries];
}
