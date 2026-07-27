/**
 * Owner-supplied verified token registry for Robinhood Mainnet (and any other
 * chain the owner verifies).
 *
 * Intentionally EMPTY. A token only appears in the Robinhood Mainnet sections
 * when a provider returns the configured Robinhood chain ID, or when the token
 * is listed here by the owner. Never add sample tokens.
 *
 * See docs/ADDING_VERIFIED_TOKENS.md.
 */

export interface VerifiedTokenConfig {
  chainId: string;
  address: string;
  symbol?: string;
  name?: string;
  logoUrl?: string;
  websiteUrl?: string;
  xUrl?: string;
  telegramUrl?: string;
  verifiedByOwner: boolean;
}

export const verifiedTokens: VerifiedTokenConfig[] = [];

export function verifiedTokensForChain(chainId: string): VerifiedTokenConfig[] {
  if (!chainId) return [];
  return verifiedTokens.filter(
    (t) => t.verifiedByOwner && t.chainId.toLowerCase() === chainId.toLowerCase(),
  );
}
