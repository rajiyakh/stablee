/**
 * Agent Hub — top-level feature configuration.
 *
 * Agent Hub is a pre-TGE preview product: no wallet-gated purchases, no real
 * farming, no real $PULSE happen yet. `VITE_AGENT_HUB_ENABLED` is the hard
 * kill-switch — when false, the route and nav entry do not exist at all.
 * `mode` only matters once the flag is true, and only changes how the
 * already-visible page behaves (see docs/AGENT_HUB_OVERVIEW.md).
 */

const env = import.meta.env as Record<string, string | undefined>;
const read = (key: string): string => (env[key] ?? "").trim();

export type AgentHubMode = "preview" | "allowlist" | "public" | "paused" | "sold-out";

export interface CompleteSetBonusConfig {
  enabled: boolean;
  requiredAgentIds: string[];
  bonusPercent: number;
  title: string;
}

export const agentHubConfig = {
  mode: "preview" as AgentHubMode,

  marketplaceEnabled: false,
  fusionEnabled: false,
  transfersEnabled: false,

  completeSetBonus: {
    enabled: false,
    requiredAgentIds: ["vector", "echo", "ledger", "atlas", "nova", "oracle"],
    bonusPercent: 0,
    title: "Genesis Intelligence Team",
  } satisfies CompleteSetBonusConfig,
} as const;

export type AgentHubConfig = typeof agentHubConfig;

/**
 * Single account-wide cap across all six Genesis Agents combined — not a
 * per-agent limit. No enforcement logic exists yet (see
 * unconfiguredMintAdapter.ts); this is a display-layer constant only until a
 * real AgentMintAdapter is wired in.
 */
export const AGENT_HUB_WALLET_LIMIT = 5;
export const AGENT_HUB_WALLET_LIMIT_LABEL = `${AGENT_HUB_WALLET_LIMIT}`;

/** Hard kill-switch — false means the route/nav entry should not exist at all. */
export function isAgentHubEnabled(): boolean {
  return read("VITE_AGENT_HUB_ENABLED") === "true";
}

/**
 * Dev-only local "add a demo agent" control. Never available in a production
 * build regardless of the env var, so a stray true value can't leak preview
 * ownership into a real deployment.
 */
export function isAgentHubPreviewEnabled(): boolean {
  return import.meta.env.DEV && read("VITE_ENABLE_AGENT_HUB_PREVIEW") === "true";
}
