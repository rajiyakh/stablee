# Agent Hub Overview

Agent Hub (`/app/agents-hub`) is a pre-TGE (Token Generation Event) preview of RobinPulse's collectible AI-agent / $PULSE-farming product. Six Genesis Agents can eventually be recruited for a fixed price; once recruited, each continuously accumulates future $PULSE allocation at its configured daily rate. Nothing on this page is live yet — no wallet-gated purchases, no real farming, no real $PULSE exist today. Every wallet is capped at 5 Genesis Agents total (not per-agent) — see `AGENT_HUB_WALLET_LIMIT` in `src/config/agentHub.ts`.

## Where everything lives

| Concern                                                    | File                                                                                |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Feature mode, complete-set bonus, marketplace/fusion flags | `src/config/agentHub.ts`                                                            |
| The six Genesis Agents (economics, lore, artwork paths)    | `src/config/genesisAgents.ts`                                                       |
| Contract addresses                                         | `src/config/contracts.ts`                                                           |
| TGE status and $PULSE distribution mode                    | `src/config/tge.ts`                                                                 |
| Farming math (elapsed time → pending allocation)           | `src/lib/agent-hub/calculatePendingAllocation.ts`, `computeElapsedActiveSeconds.ts` |
| Contract-ready "not configured" adapters                   | `src/lib/agent-hub/unconfigured*.ts`                                                |
| Local dev preview positions                                | `src/lib/agent-hub/localPreview.ts`                                                 |
| Page components                                            | `src/components/agent-hub/**`                                                       |
| Route                                                      | `src/routes/app/agents-hub.tsx`, `src/routes/app/agents-hub.$slug.tsx`              |
| Portrait artwork                                           | `public/agents/*.svg` (see `docs/AGENT_ARTWORK.md`)                                 |

## Two independent on/off signals — read this before changing either

`VITE_AGENT_HUB_ENABLED` is the **hard kill-switch**: when `false` (or unset), treat the route and nav entry as if they do not exist. `agentHubConfig.mode` (`src/config/agentHub.ts`) only matters **once the flag is true** — it governs in-page behavior (preview / allowlist / public / paused / sold-out), not whether the page exists at all. Never set `mode` to `"public"` while the env flag is still `false`; the two are not automatically kept in sync.

## Genesis Agents vs. AI analyst agents — do not merge these

`src/lib/agents.ts`'s `agents` array is a completely separate, pre-existing system: real-time market-commentary analysts that power the live feed and `src/lib/feed/consensus.ts`'s scoring. Four Genesis Agent names intentionally overlap with analyst names (Vector, Echo, Ledger, Atlas) for cross-section identity consistency; Nova and Oracle have no analyst counterpart. `genesisAgentRegistry` must never be merged into, or read through, `getAgent()` — doing so would silently make a collectible config object start participating in live consensus weighting.

## Current mode (as shipped)

- `agentHubConfig.mode`: `"preview"`
- `tgeConfig.status`: `"not-announced"`
- `tgeConfig.distributionMode`: `"not-decided"`
- `contractConfig`: every address empty
- `VITE_ENABLE_AGENT_HUB_PREVIEW`: `false` by default, and hard-disabled in any production build regardless of the env value (see `src/config/agentHub.ts`'s `isAgentHubPreviewEnabled()`)

## What happens automatically

- With no contracts configured, every recruitment card shows "Recruitment Coming Soon" and opens a non-blockchain preview modal — never a wallet prompt, never a simulated transaction.
- "My Agents" shows the exact empty-state copy ("Your research team is empty...") until either a real wallet position or a local preview position exists.
- Claim buttons show "TGE Not Live" until `tgeConfig.status` is `"claim-live"` and `tgeConfig.claimEnabled` is `true`.
