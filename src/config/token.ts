/**
 * RobinPulse protocol token configuration.
 *
 * The token has not launched. Every identifying field below is intentionally
 * EMPTY until the owner supplies verified information. Never invent a token
 * name, ticker, contract address, launch date, or tokenomics link — the
 * token page hides or degrades any UI element backed by an empty field.
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

  tokenName: "",
  tokenSymbol: "",

  headline: "The RobinPulse Protocol Token Is Coming",

  description:
    "A future utility layer designed to connect AI market intelligence, community participation, platform access, and protocol incentives.",

  launchDate: "",
  contractAddress: "",
  chainId: "",
  explorerUrl: "",

  tokenomicsUrl: "",
  documentationUrl: "",
  announcementUrl: "",

  utilities: [
    "Premium AI market intelligence",
    "Advanced market alerts",
    "Agent access",
    "Platform participation",
    "Community rewards",
    "Governance participation",
    "API and data access",
    "Future ecosystem incentives",
  ],

  socialLinks: {
    x: "",
    discord: "",
    telegram: "",
  },
};

/** True once at least one official follow-up channel has been configured. */
export function hasTokenUpdatesChannel(): boolean {
  return Boolean(
    tokenConfig.announcementUrl ||
    tokenConfig.socialLinks.x ||
    tokenConfig.socialLinks.discord ||
    tokenConfig.socialLinks.telegram,
  );
}

/** First configured follow-up URL, in priority order. */
export function primaryTokenUpdatesUrl(): string | null {
  return (
    tokenConfig.announcementUrl ||
    tokenConfig.socialLinks.x ||
    tokenConfig.socialLinks.discord ||
    tokenConfig.socialLinks.telegram ||
    null
  );
}
