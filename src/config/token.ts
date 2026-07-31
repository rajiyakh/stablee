/**
 * RobinPulse protocol token ($ORCA) configuration.
 *
 * $ORCA has not launched — no contract exists yet. `tokenName`/`tokenSymbol`/
 * `chainId` are the owner-confirmed public identity of the token and are
 * safe to display; `contractAddress`/`launchDate` stay EMPTY until the owner
 * supplies verified information post-launch. Never invent a contract
 * address, launch date, or tokenomics link — the token page hides or
 * degrades any UI element backed by an empty field.
 *
 * See docs/TOKEN_PAGE_SETUP.md for exactly where to add each value.
 */

export interface TokenConfig {
  enabled: boolean;
  status: "coming-soon" | "announced" | "launched";

  tokenName: string;
  tokenSymbol: string;

  headline: string;
  description: string;

  launchDate: string;
  contractAddress: string;
  chainId: string;
  explorerUrl: string;

  tokenomicsUrl: string;
  documentationUrl: string;
  announcementUrl: string;

  utilities: string[];

  socialLinks: {
    x: string;
    discord: string;
    telegram: string;
  };
}

export const tokenConfig: TokenConfig = {
  enabled: true,
  status: "coming-soon",

  tokenName: "RobinPulse",
  tokenSymbol: "ORCA",

  headline: "$ORCA — The Native Utility Token of RobinPulse",

  description: "The native utility token of RobinPulse, powered by the Ocean Intelligence Network.",

  launchDate: "",
  contractAddress: "",
  chainId: "Robinhood Mainnet",
  explorerUrl: "",

  tokenomicsUrl: "",
  documentationUrl: "",
  announcementUrl: "",

  utilities: [
    "Genesis Agent Farming",
    "Premium AI Access",
    "Reward Distribution",
    "Future Governance",
    "Community Incentives",
  ],

  socialLinks: {
    x: "",
    discord: "",
    telegram: "",
  },
};
