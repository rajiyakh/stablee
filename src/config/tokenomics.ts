/**
 * $ORCA tokenomics content for the /app/token documentation page
 * (src/features/tokenomics/**). Every value here is owner-authored copy —
 * the allocation percentages, agent descriptions, flow steps, and roadmap
 * are fixed content, not derived from any live system. Distinct from
 * src/config/token.ts, which still owns identity/status/social fields.
 *
 * PROTOCOL_METRICS intentionally carries labels only, never values — $ORCA
 * has not launched (see src/config/token.ts), so there is no real swap
 * volume, burn total, or treasury balance to report yet. The UI renders an
 * honest "not live yet" state for each one rather than a fabricated number.
 */

export const TOTAL_SUPPLY = 1_000_000_000;
export const TOKEN_SYMBOL = "ORCA";

export interface GenesisFarmingAgent {
  order: string;
  name: string;
  bullets: [string, string];
}

/** New, page-scoped copy for this section only — deliberately distinct from
 *  src/config/genesisAgents.ts's Agent Hub roster (Shrimp Scout, Manta
 *  Signal, Dolphin Echo, Razor Shark, Blackfin Orca, Titan Whale), which is
 *  a separate, already-built NFT-farming-license system this page doesn't
 *  touch. */
export const GENESIS_AGENTS: GenesisFarmingAgent[] = [
  {
    order: "Agent 01",
    name: "Shrimp",
    bullets: ["Scans newly launched tokens", "Detects early momentum"],
  },
  {
    order: "Agent 02",
    name: "Dolphin",
    bullets: ["Tracks smart wallets", "Detects unusual trading behavior"],
  },
  {
    order: "Agent 03",
    name: "Shark",
    bullets: ["Monitors liquidity", "Detects accumulation"],
  },
  {
    order: "Agent 04",
    name: "Orca",
    bullets: ["Analyzes market structure", "Generates high-confidence signals"],
  },
  {
    order: "Agent 05",
    name: "Whale",
    bullets: ["Tracks whale transactions", "Identifies large inflows and outflows"],
  },
  {
    order: "Agent 06",
    name: "Kraken",
    bullets: ["Combines all AI signals", "Produces final intelligence"],
  },
];

export const FARMING_FLOW: string[] = [
  "RobinPulse Intelligence Engine",
  "Users participate in AI Agent Farming",
  "Complete missions",
  "Earn Agent Points",
  "Agent Points convert into ORCA rewards",
  "Increase ecosystem participation",
];

export const REWARD_ENGINE_FLOW: string[] = [
  "Community & Ecosystem",
  "Genesis AI Agent Farming",
  "Community Participation",
  "Agent Points",
  "ORCA Rewards",
  "Active Users",
  "Protocol Growth",
];

export const REVENUE_ENGINE_FLOW: string[] = [
  "Swap",
  "Bridge",
  "Future Premium AI",
  "API Access",
  "Protocol Revenue",
  "RobinPulse Treasury",
];

export const TREASURY_CATEGORIES: string[] = [
  "AI Development",
  "Infrastructure",
  "Liquidity",
  "Security",
  "Marketing",
  "Community",
  "Future Expansion",
];

export const UTILITY_ITEMS: string[] = [
  "Lower Swap Fees",
  "Lower Bridge Fees",
  "Premium AI Signals",
  "Advanced Whale Tracking",
  "Priority AI Agents",
  "Exclusive Campaigns",
  "Future Governance",
  "Future API Credits",
];

export const BUYBACK_BURN_FLOW: string[] = [
  "Protocol Revenue",
  "Treasury",
  "Periodic Buyback",
  "ORCA Burn",
  "Reduced Circulating Supply",
  "Long-Term Scarcity",
];

export const ECONOMY_LOOP_FLOW: string[] = [
  "Users",
  "Use RobinPulse",
  "Generate Protocol Fees",
  "Treasury",
  "Build Better AI",
  "Better Products",
  "More Users",
  "Higher ORCA Utility",
  "Repeat",
];

/** Labels only — see file header. No `value` field on purpose. */
export const PROTOCOL_METRICS: string[] = [
  "Swap Volume",
  "Bridge Volume",
  "Protocol Revenue",
  "Active Users",
  "AI Signals Generated",
  "Whale Alerts",
  "ORCA Burned",
  "Treasury Balance",
];

export interface RoadmapPhase {
  phase: string;
  title: string;
  items: string[];
}

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: "Phase 1",
    title: "RobinPulse Launch",
    items: ["AI Feed", "Trending", "Swap"],
  },
  {
    phase: "Phase 2",
    title: "Genesis AI Agent Farming",
    items: ["ORCA Distribution", "Community Campaigns"],
  },
  {
    phase: "Phase 3",
    title: "Bridge & Intelligence",
    items: ["Bridge", "Premium AI", "Whale Intelligence", "Advanced Analytics"],
  },
  {
    phase: "Phase 4",
    title: "Governance & Expansion",
    items: ["Governance", "Developer API", "Institutional Dashboard", "Multi-chain Expansion"],
  },
];
