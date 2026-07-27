/**
 * Whitelist-only external trading routing for the Robinhood Mainnet Buy
 * button. A provider response can NEVER inject or influence a destination —
 * every URL here is built from a fixed, reviewed domain template plus a
 * validated on-chain address. Nothing is enabled unless it has been
 * confirmed to actually support Robinhood Chain (see docs/TRADING_DESTINATIONS.md).
 */

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export type TradingDestinationKind =
  "robinhood-aggregator" | "provider-supplied" | "gmgn" | "uniswap" | "detected-dex";

export interface TradingDestinationToken {
  chain: "robinhood";
  address: string;
  pairAddress?: string;
  dexName?: string;
  /** A trading URL the provider itself returned for this token, if any — never fabricated. */
  providerTradingUrl?: string;
}

export interface TradingDestination {
  id: string;
  kind: TradingDestinationKind;
  label: string;
  /** Lower tries first. */
  priority: number;
  enabled: boolean;
  /** Hostname the resolved URL must match — a hard check, not documentation. */
  domain: string;
  isVerifiedFor: (token: TradingDestinationToken) => boolean;
  buildTokenUrl: (token: TradingDestinationToken) => string | null;
}

export const TRADING_DESTINATIONS: TradingDestination[] = [
  {
    id: "robinhood-aggregator",
    kind: "robinhood-aggregator",
    label: "Robinhood Aggregator",
    priority: 1,
    // No owner-configured aggregator exists yet. Enable only once a real,
    // reviewed aggregator URL template is supplied — never guess one.
    enabled: false,
    domain: "",
    isVerifiedFor: () => false,
    buildTokenUrl: () => null,
  },
  {
    id: "gmgn-provider-supplied",
    kind: "provider-supplied",
    label: "GMGN Trading Link",
    priority: 2,
    // GMGN's rank/hot-searches responses do not include a dedicated
    // trading-URL field (only website/twitter/telegram). This slot exists
    // for the shape but is inert until such a field is confirmed real.
    enabled: false,
    domain: "",
    isVerifiedFor: (token) => Boolean(token.providerTradingUrl),
    buildTokenUrl: () => null,
  },
  {
    id: "gmgn-token-page",
    kind: "gmgn",
    label: "View on GMGN",
    priority: 3,
    enabled: true,
    domain: "gmgn.ai",
    isVerifiedFor: (token) => EVM_ADDRESS_RE.test(token.address),
    buildTokenUrl: (token) =>
      EVM_ADDRESS_RE.test(token.address)
        ? `https://gmgn.ai/robinhood/token/${token.address}`
        : null,
  },
  {
    id: "uniswap",
    kind: "uniswap",
    label: "Uniswap",
    priority: 4,
    // Confirmed live: Uniswap's own blog (blog.uniswap.org/robinhood-chain-is-live)
    // and developer docs (v3-robinhood-chain-deployments, real factory/router
    // addresses published) confirm v2/v3/v4/UniswapX are deployed on Robinhood
    // Chain (id 4663) as of this integration. The `chain=robinhood` URL slug
    // was confirmed against a real, live, indexed app.uniswap.org URL and
    // verified to return HTTP 200 before enabling this destination.
    enabled: true,
    domain: "app.uniswap.org",
    isVerifiedFor: (token) => EVM_ADDRESS_RE.test(token.address),
    buildTokenUrl: (token) =>
      EVM_ADDRESS_RE.test(token.address)
        ? `https://app.uniswap.org/swap?chain=robinhood&outputCurrency=${token.address}`
        : null,
  },
  {
    id: "detected-dex",
    kind: "detected-dex",
    label: "DEX Interface",
    priority: 5,
    // A per-pair DEX interface (e.g. from `dexName`) is not yet verified to
    // resolve to a real, safe trading URL for Robinhood Mainnet pairs.
    enabled: false,
    domain: "",
    isVerifiedFor: () => false,
    buildTokenUrl: () => null,
  },
];

export function resolveTradingDestination(
  token: TradingDestinationToken,
): { destination: TradingDestination; url: string } | null {
  if (!EVM_ADDRESS_RE.test(token.address)) return null;

  const candidates = [...TRADING_DESTINATIONS]
    .filter((d) => d.enabled)
    .sort((a, b) => a.priority - b.priority);

  for (const destination of candidates) {
    if (!destination.isVerifiedFor(token)) continue;
    const url = destination.buildTokenUrl(token);
    if (!url) continue;

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") continue;
      if (parsed.hostname !== destination.domain) continue;
      return { destination, url: parsed.toString() };
    } catch {
      continue;
    }
  }

  return null;
}
