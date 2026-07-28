/**
 * Central project configuration.
 *
 * Every externally-supplied value lives here. Values are intentionally EMPTY
 * until the owner supplies verified information. Never invent social handles,
 * RPC URLs, chain IDs, explorer URLs, contract addresses or documentation
 * links — the UI hides or degrades gracefully when a value is empty.
 *
 * Values can also be supplied through Vite env vars (see .env.example).
 */

const env = import.meta.env as Record<string, string | undefined>;
const read = (key: string): string => (env[key] ?? "").trim();

export const projectConfig = {
  name: read("VITE_APP_NAME") || "RobinPulse AI",
  shortName: "RobinPulse",
  tagline: "Public AI intelligence for tokenized equities and Robinhood Mainnet markets.",

  description:
    "Public market intelligence for tokenized equities and Robinhood Mainnet tokens, built on live third-party market data.",

  logoUrl: "",
  faviconUrl: "",

  websiteUrl: read("VITE_PROJECT_WEBSITE_URL"),
  documentationUrl: read("VITE_PROJECT_DOCS_URL"),
  whitepaperUrl: read("VITE_PROJECT_WHITEPAPER_URL"),

  socialLinks: {
    x: read("VITE_X_URL"),
    discord: read("VITE_DISCORD_URL"),
    telegram: read("VITE_TELEGRAM_URL"),
    github: read("VITE_GITHUB_URL"),
    medium: read("VITE_MEDIUM_URL"),
  },

  contact: {
    email: read("VITE_CONTACT_EMAIL"),
    supportUrl: read("VITE_SUPPORT_URL"),
  },

  wallet: {
    enabled: read("VITE_WALLET_ENABLED") === "true",
    chainName: read("VITE_ROBINHOOD_CHAIN_NAME") || "Robinhood Mainnet",
    chainId: Number(read("VITE_ROBINHOOD_CHAIN_ID")) || null,
    rpcUrl: read("VITE_ROBINHOOD_RPC_URL"),
    explorerUrl: read("VITE_ROBINHOOD_EXPLORER_URL"),
    nativeCurrencyName: read("VITE_ROBINHOOD_NATIVE_CURRENCY_NAME"),
    nativeCurrencySymbol: read("VITE_ROBINHOOD_NATIVE_CURRENCY_SYMBOL"),
    // Privy is the connection provider; it supplies its own WalletConnect
    // relay by default, so this project ID is optional (advanced/self-hosted
    // WalletConnect Cloud config only) and never required by isWalletConfigured().
    walletConnectProjectId: read("VITE_WALLETCONNECT_PROJECT_ID"),
    privyAppId: read("VITE_PRIVY_APP_ID"),
  },

  dataSources: {
    // Private keys are NEVER read here. Server-side only (see .env.example).
    coinGeckoApiKey: "",
    coinGeckoPlan: "demo",
    dexScreenerEnabled: true,
    geckoTerminalEnabled: true,
    robinhoodDexScreenerChainId: read("VITE_ROBINHOOD_DEXSCREENER_CHAIN_ID"),
  },
} as const;

export type ProjectConfig = typeof projectConfig;

/** Shared copy for every wallet-gated page/section — keeps wording in sync. */
export const WALLET_NOT_CONFIGURED_MESSAGE =
  "Wallet integration is not yet configured for this deployment.";

/** Wallet connection is only possible once every required field is supplied. */
export function isWalletConfigured(): boolean {
  const w = projectConfig.wallet;
  return Boolean(
    w.enabled &&
    w.chainId !== null &&
    w.chainName &&
    w.rpcUrl &&
    w.explorerUrl &&
    w.nativeCurrencyName &&
    w.nativeCurrencySymbol &&
    w.privyAppId,
  );
}

/** Only non-empty social links are ever rendered. */
export function configuredSocialLinks(): Array<{ key: string; label: string; url: string }> {
  const labels: Record<string, string> = {
    x: "X",
    discord: "Discord",
    telegram: "Telegram",
    github: "GitHub",
    medium: "Medium",
  };
  return Object.entries(projectConfig.socialLinks)
    .filter(([, url]) => Boolean(url))
    .map(([key, url]) => ({ key, label: labels[key] ?? key, url }));
}
