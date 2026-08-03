import type { BridgeProviderId } from "./types";

/**
 * Known, hardcoded API hosts for each provider — checked before every
 * outbound adapter fetch so a mistyped or hostile base-URL override can
 * never silently redirect bridge traffic elsewhere.
 */
const PROVIDER_HOSTS: Record<BridgeProviderId, string[]> = {
  lifi: ["li.quest"],
  relay: ["api.relay.link"],
  across: ["app.across.to"],
  gaszip: ["backend.gas.zip"],
};

export class UntrustedHostError extends Error {
  constructor(
    public provider: BridgeProviderId,
    public host: string,
  ) {
    super(`Refusing to call untrusted host "${host}" for provider "${provider}".`);
  }
}

/** Throws UntrustedHostError unless the URL's exact host is on the provider's allowlist. */
export function assertAllowedHost(provider: BridgeProviderId, url: string): void {
  const host = new URL(url).host;
  const allowed = PROVIDER_HOSTS[provider];
  if (!allowed.includes(host)) {
    throw new UntrustedHostError(provider, host);
  }
}

/**
 * Optional, owner-verified per-chain contract pinning from
 * BRIDGE_CONTRACT_ALLOWLIST (JSON `{"<chainId>": ["0x..."]}`). Empty by
 * default — meaning "trust only what the provider's own API returned",
 * which is always enforced separately in validateBridgeQuote regardless of
 * whether this pinning is configured. Never pre-filled with guessed
 * addresses, matching the house rule in src/config/project.ts.
 */
export function parseContractAllowlist(raw: string | undefined): Record<number, string[]> {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    const result: Record<number, string[]> = {};
    for (const [chainId, addresses] of Object.entries(parsed as Record<string, unknown>)) {
      const id = Number(chainId);
      if (!Number.isFinite(id) || !Array.isArray(addresses)) continue;
      result[id] = addresses.filter((a): a is string => typeof a === "string");
    }
    return result;
  } catch {
    return {};
  }
}

/** true when no allowlist is configured for this chain (nothing to check against) OR the address is pinned. */
export function isAllowedContract(
  allowlist: Record<number, string[]>,
  chainId: number,
  address: string,
): boolean {
  const pinned = allowlist[chainId];
  if (!pinned || pinned.length === 0) return true;
  return pinned.some((a) => a.toLowerCase() === address.toLowerCase());
}
