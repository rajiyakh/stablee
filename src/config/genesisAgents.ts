/**
 * Genesis Agent registry — Agent Hub's collectible pre-TGE farming licenses.
 *
 * The RobinPulse Ocean Intelligence Fleet: six autonomous marine AI agents,
 * unrelated to the live AI-analyst roster in src/lib/agents.ts (which powers
 * the home feed and consensus scoring — a completely separate system with
 * its own agent identities). Never merge this array into, or read it from,
 * getAgent() — that function is relied on by live feed rendering and
 * src/lib/feed/consensus.ts's SPECIALTY_WEIGHT.
 *
 * Every value below (price, supply, farming rate) is an editable
 * starter/pre-launch configuration, not final on-chain truth. See
 * docs/AGENT_ECONOMY_CONFIG.md — prices, supplies, and farming rates must be
 * reviewed before contract deployment. The wallet limit is a single global
 * cap across all six Agents, not a per-agent value — see
 * AGENT_HUB_WALLET_LIMIT in src/config/agentHub.ts.
 *
 * Farming is displayed to users exclusively as a daily rate ($ORCA/day,
 * `pulsePerDay`) — never hourly. See docs/AGENT_FARMING_CALCULATION.md.
 */

export type AgentRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";

export interface GenesisAgentConfig {
  id: string;
  tokenIdStart?: number;
  name: string;
  slug: string;
  title: string;
  rarity: AgentRarity;
  role: string;
  shortDescription: string;
  lore: string;

  price: string;
  paymentTokenSymbol: string;

  maxSupply: number;

  pulsePerDay: string;

  accent: string;
  secondaryAccent: string;
  avatarPath: string;

  specialties: string[];
  personalityTraits: string[];

  enabled: boolean;
}

/** Base-unit decimals for $ORCA amounts used by farming-math calculations. Editable once the real token is finalized. */
export const pulseTokenDecimals = 18;

export const genesisAgentRegistry: GenesisAgentConfig[] = [
  {
    id: "shrimp-scout",
    name: "Shrimp Scout",
    slug: "shrimp-scout",
    title: "New Token Scout",
    rarity: "Common",
    role: "New Token Scout",
    shortDescription: "Scans newly deployed Robinhood Mainnet tokens before they trend.",
    lore: "Scans newly deployed Robinhood Mainnet tokens before they trend.",
    price: "0.015",
    paymentTokenSymbol: "ETH",
    maxSupply: 2500,
    pulsePerDay: "75",
    accent: "brand",
    secondaryAccent: "positive",
    avatarPath: "/agents/shrimp-scout.webp",
    specialties: ["New token scans", "Early discovery", "Pre-trend detection"],
    personalityTraits: ["Curious", "Fast", "Alert"],
    enabled: true,
  },
  {
    id: "manta-signal",
    name: "Manta Signal",
    slug: "manta-signal",
    title: "Momentum Signal Analyst",
    rarity: "Uncommon",
    role: "Momentum Signal Analyst",
    shortDescription: "Tracks momentum, social attention and market signals.",
    lore: "Tracks momentum, social attention and market signals.",
    price: "0.05",
    paymentTokenSymbol: "ETH",
    maxSupply: 1500,
    pulsePerDay: "300",
    accent: "agent-cyan",
    secondaryAccent: "positive",
    avatarPath: "/agents/manta-signal.webp",
    specialties: ["Momentum tracking", "Social attention", "Market signals"],
    personalityTraits: ["Perceptive", "Responsive", "Sharp"],
    enabled: true,
  },
  {
    id: "dolphin-echo",
    name: "Dolphin Echo",
    slug: "dolphin-echo",
    title: "Trend & Sentiment Analyst",
    rarity: "Rare",
    role: "Trend & Sentiment Analyst",
    shortDescription: "Analyzes trend continuation and market sentiment.",
    lore: "Analyzes trend continuation and market sentiment.",
    price: "0.10",
    paymentTokenSymbol: "ETH",
    maxSupply: 750,
    pulsePerDay: "900",
    accent: "warning",
    secondaryAccent: "negative",
    avatarPath: "/agents/dolphin-echo.webp",
    specialties: ["Trend continuation", "Market sentiment", "Pattern analysis"],
    personalityTraits: ["Analytical", "Calm", "Precise"],
    enabled: true,
  },
  {
    id: "razor-shark",
    name: "Razor Shark",
    slug: "razor-shark",
    title: "Liquidity Migration Analyst",
    rarity: "Epic",
    role: "Liquidity Migration Analyst",
    shortDescription: "Detects liquidity migration and high conviction trades.",
    lore: "Detects liquidity migration and high conviction trades.",
    price: "0.15",
    paymentTokenSymbol: "ETH",
    maxSupply: 300,
    pulsePerDay: "1500",
    accent: "primary",
    secondaryAccent: "muted-foreground",
    avatarPath: "/agents/razor-shark.webp",
    specialties: ["Liquidity migration", "High-conviction trades", "Flow detection"],
    personalityTraits: ["Decisive", "Aggressive", "Focused"],
    enabled: true,
  },
  {
    id: "blackfin-orca",
    name: "Blackfin Orca",
    slug: "blackfin-orca",
    title: "Whale Intelligence Analyst",
    rarity: "Legendary",
    role: "Whale Intelligence Analyst",
    shortDescription: "Tracks whale wallets and smart money movement.",
    lore: "Tracks whale wallets and smart money movement.",
    price: "0.20",
    paymentTokenSymbol: "ETH",
    maxSupply: 100,
    pulsePerDay: "2100",
    accent: "agent-purple",
    secondaryAccent: "brand",
    avatarPath: "/agents/blackfin-orca.webp",
    specialties: ["Whale tracking", "Smart money flow", "Wallet monitoring"],
    personalityTraits: ["Vigilant", "Strategic", "Patient"],
    enabled: true,
  },
  {
    id: "titan-whale",
    name: "Titan Whale",
    slug: "titan-whale",
    title: "Master Intelligence Agent",
    rarity: "Mythic",
    role: "Master Intelligence Agent",
    shortDescription: "Master AI intelligence unit aggregating all market signals.",
    lore: "Master AI intelligence unit aggregating all market signals.",
    price: "0.25",
    paymentTokenSymbol: "ETH",
    maxSupply: 25,
    pulsePerDay: "4000",
    accent: "agent-mythic",
    secondaryAccent: "brand",
    avatarPath: "/agents/titan-whale.webp",
    specialties: ["Multi-signal aggregation", "Market-wide analysis", "Agent consensus"],
    personalityTraits: ["Composed", "Omniscient", "Deliberate"],
    enabled: true,
  },
];

export function getGenesisAgent(slug: string): GenesisAgentConfig | undefined {
  return genesisAgentRegistry.find((agent) => agent.slug === slug);
}

export function enabledGenesisAgents(): GenesisAgentConfig[] {
  return genesisAgentRegistry.filter((agent) => agent.enabled);
}
