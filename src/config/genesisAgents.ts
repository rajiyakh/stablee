/**
 * Genesis Agent registry — Agent Hub's collectible pre-TGE farming licenses.
 *
 * This is a completely separate data set from src/lib/agents.ts (the live
 * AI-analyst roster that powers the feed and consensus scoring). Four names
 * intentionally overlap (Vector, Echo, Ledger, Atlas) for cross-section
 * identity consistency; Nova and Oracle are Agent-Hub-exclusive. Never merge
 * this array into, or read it from, getAgent() — that function is relied on
 * by live feed rendering and src/lib/feed/consensus.ts's SPECIALTY_WEIGHT.
 *
 * Every value below (price, supply, wallet limit, farming rate) is an
 * editable starter/pre-launch configuration, not final on-chain truth. See
 * docs/AGENT_ECONOMY_CONFIG.md — prices, supplies, limits, and farming rates
 * must be reviewed before contract deployment.
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
  walletLimit: number;

  pulsePerHour: string;
  farmingMultiplier: number;

  accent: string;
  secondaryAccent: string;
  avatarPath: string;

  specialties: string[];
  personalityTraits: string[];

  enabled: boolean;
}

/** Base-unit decimals for $PULSE amounts used by farming-math calculations. Editable once the real token is finalized. */
export const pulseTokenDecimals = 18;

export const genesisAgentRegistry: GenesisAgentConfig[] = [
  {
    id: "vector",
    name: "Vector",
    slug: "vector",
    title: "Momentum Analyst",
    rarity: "Common",
    role: "Momentum Analyst",
    shortDescription: "Reads acceleration, breakouts, and short-term market structure.",
    lore: "Vector reads acceleration, breakouts, and short-term market structure. It is the fastest entry-level Agent in the RobinPulse network.",
    price: "25",
    paymentTokenSymbol: "USDG",
    maxSupply: 2500,
    walletLimit: 10,
    pulsePerHour: "1",
    farmingMultiplier: 1,
    accent: "brand",
    secondaryAccent: "positive",
    avatarPath: "/agents/vector.webp",
    specialties: ["Momentum", "Breakouts", "Trend continuation"],
    personalityTraits: ["Fast", "Direct", "Alert"],
    enabled: true,
  },
  {
    id: "echo",
    name: "Echo",
    slug: "echo",
    title: "Market Attention Analyst",
    rarity: "Uncommon",
    role: "Market Attention Analyst",
    shortDescription: "Monitors market attention, search velocity, and narrative shifts.",
    lore: "Echo monitors market attention, search velocity, narrative shifts, and rapidly emerging token activity.",
    price: "45",
    paymentTokenSymbol: "USDG",
    maxSupply: 1800,
    walletLimit: 8,
    pulsePerHour: "2",
    farmingMultiplier: 2,
    accent: "agent-cyan",
    secondaryAccent: "positive",
    avatarPath: "/agents/echo.webp",
    specialties: ["Hot searches", "Market attention", "Narrative velocity"],
    personalityTraits: ["Perceptive", "Curious", "Attentive"],
    enabled: true,
  },
  {
    id: "ledger",
    name: "Ledger",
    slug: "ledger",
    title: "Risk Intelligence Agent",
    rarity: "Rare",
    role: "Risk Intelligence Agent",
    shortDescription: "Evaluates liquidity, volatility, slippage, and downside conditions.",
    lore: "Ledger evaluates liquidity, volatility, slippage, and downside conditions before an opportunity becomes dangerous.",
    price: "90",
    paymentTokenSymbol: "USDG",
    maxSupply: 1000,
    walletLimit: 5,
    pulsePerHour: "4",
    farmingMultiplier: 4,
    accent: "warning",
    secondaryAccent: "negative",
    avatarPath: "/agents/ledger.webp",
    specialties: ["Risk analysis", "Liquidity health", "Volatility"],
    personalityTraits: ["Cautious", "Methodical", "Vigilant"],
    enabled: true,
  },
  {
    id: "atlas",
    name: "Atlas",
    slug: "atlas",
    title: "Whale and Liquidity Analyst",
    rarity: "Epic",
    role: "Whale and Liquidity Analyst",
    shortDescription: "Tracks large trades, unusual capital movements, and liquidity migration.",
    lore: "Atlas tracks large trades, unusual capital movements, liquidity migration, and major market participants.",
    price: "175",
    paymentTokenSymbol: "USDG",
    maxSupply: 500,
    walletLimit: 3,
    pulsePerHour: "7",
    farmingMultiplier: 7,
    accent: "primary",
    secondaryAccent: "muted-foreground",
    avatarPath: "/agents/atlas.webp",
    specialties: ["Whale flow", "Large trades", "Liquidity movement"],
    personalityTraits: ["Steady", "Heavyweight", "Watchful"],
    enabled: true,
  },
  {
    id: "nova",
    name: "Nova",
    slug: "nova",
    title: "New Launch Hunter",
    rarity: "Legendary",
    role: "New Launch Hunter",
    shortDescription: "Scans newly created markets and identifies early meaningful activity.",
    lore: "Nova scans newly created Robinhood Mainnet markets and identifies tokens gaining meaningful activity shortly after launch.",
    price: "350",
    paymentTokenSymbol: "USDG",
    maxSupply: 150,
    walletLimit: 2,
    pulsePerHour: "12",
    farmingMultiplier: 12,
    accent: "agent-purple",
    secondaryAccent: "brand",
    avatarPath: "/agents/nova.webp",
    specialties: ["New launches", "Early trends", "Activity acceleration"],
    personalityTraits: ["Bold", "Fast-igniting", "Restless"],
    enabled: true,
  },
  {
    id: "oracle",
    name: "Oracle",
    slug: "oracle",
    title: "Master Intelligence Agent",
    rarity: "Mythic",
    role: "Master Intelligence Agent",
    shortDescription:
      "Combines momentum, liquidity, risk, attention, and whale activity into one view.",
    lore: "Oracle combines momentum, liquidity, risk, market attention, and whale activity into a high-level intelligence view.",
    price: "700",
    paymentTokenSymbol: "USDG",
    maxSupply: 50,
    walletLimit: 1,
    pulsePerHour: "20",
    farmingMultiplier: 20,
    accent: "agent-mythic",
    secondaryAccent: "brand",
    avatarPath: "/agents/oracle.webp",
    specialties: ["Multi-signal intelligence", "Agent consensus", "Market-wide analysis"],
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
