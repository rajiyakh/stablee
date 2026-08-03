import type { ProviderState, ProviderStatus } from "@/lib/market/types";

const stateRank: Record<ProviderState, number> = {
  live: 3,
  delayed: 2,
  unavailable: 1,
  not_configured: 0,
};

function bestState(providers: ProviderStatus[], ids: string[]): ProviderState {
  return providers
    .filter((p) => ids.includes(p.id))
    .reduce<ProviderState>(
      (best, p) => (stateRank[p.state] > stateRank[best] ? p.state : best),
      "not_configured",
    );
}

/** Shared status-summary derivation used by the Overview page's status widget. */
export function deriveProviderStates(providers: ProviderStatus[] | undefined): {
  marketDataState: ProviderState;
  robinhoodState: ProviderState;
} {
  const list = providers ?? [];
  return {
    marketDataState: bestState(list, ["coingecko", "dexscreener"]),
    robinhoodState: bestState(list, ["robinhood"]),
  };
}
