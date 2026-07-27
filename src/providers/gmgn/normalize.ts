import type {
  GmgnInterval,
  RobinhoodHotSearchToken,
  RobinhoodTrendingToken,
  SecurityFlags,
} from "@/types/gmgn";
import type { GmgnRankItemParsed } from "./schemas";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Defense in depth: the CLI is always called with --chain robinhood, but a
 * provider response should never be trusted blindly. Anything not shaped
 * like a Robinhood Mainnet EVM token is dropped rather than shown.
 */
function isRobinhoodEvmItem(item: GmgnRankItemParsed): boolean {
  return item.chain === "robinhood" && EVM_ADDRESS_RE.test(item.address);
}

function buildSecurity(item: GmgnRankItemParsed): SecurityFlags | undefined {
  const flags: SecurityFlags = {};
  if (item.is_honeypot !== null && item.is_honeypot !== undefined)
    flags.honeypot = item.is_honeypot;
  if (item.renounced_mint !== null && item.renounced_mint !== undefined) {
    flags.renounced = Boolean(item.renounced_mint && item.renounced_freeze_account);
  }
  if (item.top_10_holder_rate !== null && item.top_10_holder_rate !== undefined) {
    flags.topHolderPercent = item.top_10_holder_rate * 100;
  }
  if (item.dev_team_hold_rate !== null && item.dev_team_hold_rate !== undefined) {
    flags.creatorHoldingPercent = item.dev_team_hold_rate * 100;
  }
  if (item.bundler_rate !== null && item.bundler_rate !== undefined) {
    flags.bundledPercent = item.bundler_rate * 100;
  }
  return Object.keys(flags).length > 0 ? flags : undefined;
}

function buildExternalLinks(item: GmgnRankItemParsed): RobinhoodTrendingToken["externalLinks"] {
  const links: RobinhoodTrendingToken["externalLinks"] = {
    gmgn: `https://gmgn.ai/robinhood/token/${item.address}`,
  };
  if (item.pair_address)
    links.dexScreener = `https://dexscreener.com/robinhood/${item.pair_address}`;
  if (item.website) links.website = item.website;
  if (item.twitter) links.x = item.twitter;
  if (item.telegram) links.telegram = item.telegram;
  return links;
}

/**
 * A single GMGN call is scoped to one interval, so the generic
 * volume/swaps/buys/sells/price_change_percent fields on the raw item only
 * ever populate the matching interval-specific slot below — every other
 * interval's field is left undefined rather than guessed or zero-filled.
 */
function applyIntervalFields(
  token: RobinhoodTrendingToken,
  item: GmgnRankItemParsed,
  interval: GmgnInterval,
): void {
  const volume = item.volume ?? undefined;
  const transactions = item.swaps ?? undefined;
  const buys = item.buys ?? undefined;
  const sells = item.sells ?? undefined;
  const priceChange = item.price_change_percent ?? undefined;

  switch (interval) {
    case "1m":
      token.volume1mUsd = volume;
      token.transactions1m = transactions;
      token.buys1m = buys;
      token.sells1m = sells;
      token.priceChange1m = priceChange;
      break;
    case "5m":
      token.volume5mUsd = volume;
      token.transactions5m = transactions;
      token.priceChange5m = priceChange;
      break;
    case "1h":
      token.volume1hUsd = volume;
      token.transactions1h = transactions;
      token.buys1h = buys;
      token.sells1h = sells;
      token.priceChange1h = priceChange;
      break;
    case "6h":
      token.volume6hUsd = volume;
      token.transactions6h = transactions;
      token.priceChange6h = priceChange;
      break;
    case "24h":
      token.volume24hUsd = volume;
      token.transactions24h = transactions;
      token.priceChange24h = priceChange;
      break;
  }
}

function toBaseToken(
  item: GmgnRankItemParsed,
  interval: GmgnInterval,
  rank: number,
  updatedAt: string,
): RobinhoodTrendingToken | null {
  if (!item.name && !item.symbol) return null;

  const token: RobinhoodTrendingToken = {
    rank,
    chain: "robinhood",
    address: item.address,
    name: item.name ?? item.symbol ?? "Unknown",
    symbol: item.symbol ?? "—",
    logoUrl: item.logo ?? undefined,
    pairAddress: item.pair_address ?? undefined,
    dexName: item.dex ?? undefined,
    createdAt: item.created_timestamp
      ? new Date(item.created_timestamp * 1000).toISOString()
      : undefined,
    ageSeconds: item.created_timestamp
      ? Math.max(0, Date.now() / 1000 - item.created_timestamp)
      : undefined,
    priceUsd: item.price ?? undefined,
    marketCapUsd: item.market_cap ?? undefined,
    athMarketCapUsd: item.history_highest_marketcap ?? undefined,
    liquidityUsd: item.liquidity ?? undefined,
    holders: item.holder_count ?? undefined,
    totalFeesNative: item.gas_fee ?? undefined,
    visitingCount: item.visiting_count ?? undefined,
    security: buildSecurity(item),
    externalLinks: buildExternalLinks(item),
    provider: "GMGN",
    updatedAt,
  };

  applyIntervalFields(token, item, interval);
  return token;
}

export function normalizeTrending(
  items: GmgnRankItemParsed[],
  interval: GmgnInterval,
): RobinhoodTrendingToken[] {
  const updatedAt = new Date().toISOString();
  const result: RobinhoodTrendingToken[] = [];

  items.forEach((item, index) => {
    if (!isRobinhoodEvmItem(item)) return;
    const token = toBaseToken(item, interval, item.rank ?? index + 1, updatedAt);
    if (token) result.push(token);
  });

  return result;
}

export function normalizeHotSearches(
  items: GmgnRankItemParsed[],
  interval: GmgnInterval,
): RobinhoodHotSearchToken[] {
  const updatedAt = new Date().toISOString();
  const result: RobinhoodHotSearchToken[] = [];

  items.forEach((item, index) => {
    if (!isRobinhoodEvmItem(item)) return;
    const searchRank = item.rank ?? index + 1;
    const base = toBaseToken(item, interval, searchRank, updatedAt);
    if (!base) return;

    result.push({
      ...base,
      searchRank,
      searchHeat: item.visiting_count ?? undefined,
      interval,
      providerTimestamp: updatedAt,
    });
  });

  return result;
}
