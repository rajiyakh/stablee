# Agent Economy Configuration

The six Genesis Agents live at `src/config/genesisAgents.ts`, exported as `genesisAgentRegistry: GenesisAgentConfig[]`. Every value below is an editable pre-launch starter configuration — none of it is read from a contract yet, and none of it should be treated as final until reviewed before deployment.

## Entry shape

```ts
export interface GenesisAgentConfig {
  id: string;
  name: string;
  slug: string;
  title: string;
  rarity: AgentRarity; // "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic"
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
```

## What the owner can change here, and where it shows up

| Field                                               | Where it's shown                                                                                                                                                                                                                                                           |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `title`, `role`, `lore`, `shortDescription` | Recruitment card, comparison table, detail page                                                                                                                                                                                                                            |
| `rarity`                                            | Rarity badge/frame color everywhere (`src/components/agent-hub/RarityBadge.tsx`, `RarityFrame.tsx`)                                                                                                                                                                        |
| `price`, `paymentTokenSymbol`                       | Recruitment card, comparison table, recruitment confirmation modal                                                                                                                                                                                                         |
| `maxSupply`                                         | Everywhere — this is the ONLY supply figure ever shown pre-integration (never a minted/remaining count, see `docs/AGENT_CONTRACT_INTEGRATION.md`)                                                                                                                          |
| `walletLimit`                                       | Recruitment card, comparison table, detail page, recruitment modal                                                                                                                                                                                                         |
| `pulsePerHour`, `farmingMultiplier`                 | Recruitment card, comparison table, farming calculations (`docs/AGENT_FARMING_CALCULATION.md`)                                                                                                                                                                             |
| `accent`, `secondaryAccent`                         | Per-agent bespoke card/portrait accent — a Tailwind color token name (`primary`, `brand`, `positive`, `warning`, `negative`, `muted-foreground`, `agent-cyan`, `agent-purple`, `agent-gold`, `agent-mythic`). This is separate from the systemic rarity-badge color scale. |
| `avatarPath`                                        | Path under `public/agents/` — see `docs/AGENT_ARTWORK.md`                                                                                                                                                                                                                  |
| `specialties`, `personalityTraits`                  | Detail page                                                                                                                                                                                                                                                                |
| `enabled`                                           | Set `false` to hide an agent from the grid/comparison table/routing without deleting its config                                                                                                                                                                            |

## Disabling an agent temporarily

Set `enabled: false`. `enabledGenesisAgents()` (also exported from this file) filters on this flag and is what every page component consumes — the raw `genesisAgentRegistry` array always contains all six regardless.

## Complete-set bonus (disabled by default)

```ts
completeSetBonus: {
  enabled: false,
  requiredAgentIds: ["vector", "echo", "ledger", "atlas", "nova", "oracle"],
  bonusPercent: 0,
  title: "Genesis Intelligence Team",
}
```

This lives in `src/config/agentHub.ts`, not `genesisAgents.ts`. It is not shown anywhere in the UI while `enabled: false` — never promise a set bonus that isn't live.

## Before deployment

Review every `price`, `maxSupply`, `walletLimit`, `pulsePerHour`, and `farmingMultiplier` value with whoever owns the final tokenomics. These are the exact starter values supplied when this feature was built and have not been independently verified against a deployed contract.
