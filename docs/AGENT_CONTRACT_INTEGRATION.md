# Agent Contract Integration

Contract addresses live at `src/config/contracts.ts`, exported as `contractConfig`. Every address is empty until the owner supplies a real, deployed address — this app never invents, guesses, or falls back to a sample address, and functionality stays disabled until every required field is present.

## Entry shape

```ts
export const contractConfig = {
  chainId: null, // resolved via agentHubChainId(), NOT its own env var — see below
  agentCollection: "", // VITE_AGENT_COLLECTION_CONTRACT
  agentFarming: "", // VITE_AGENT_FARMING_CONTRACT
  pulseToken: "", // VITE_PULSE_TOKEN_CONTRACT
  pulseClaim: "", // VITE_PULSE_CLAIM_CONTRACT
  treasury: "", // not wired to an env var yet — see below
};
```

## Why `chainId` has no env var of its own

Agent Hub deploys to the same Robinhood Mainnet chain the rest of the app already targets. `agentHubChainId()` returns `projectConfig.wallet.chainId` (already populated from `VITE_ROBINHOOD_CHAIN_ID` — see `docs/PROJECT_CONFIGURATION.md`) instead of asking the owner to fill in the same chain facts a second time under a different variable name. Do not add a second `VITE_AGENT_HUB_CHAIN_ID` — it would only create a second source of truth that can drift out of sync.

## Setting the four contract addresses

Add each to `.env` (not `.env.example` — that file stays empty):

```
VITE_AGENT_COLLECTION_CONTRACT=0x...
VITE_AGENT_FARMING_CONTRACT=0x...
VITE_PULSE_TOKEN_CONTRACT=0x...
VITE_PULSE_CLAIM_CONTRACT=0x...
```

Validate each address (checksummed, correct length, deployed on the correct chain) before setting it — `isAgentHubContractsConfigured()` only checks that a value is present and non-empty, it does not validate the address is real or correctly deployed.

## `treasury`

Not wired to an env var. This needs an explicit owner-designated Agent Hub treasury address — reusing `ROBINPULSE_FEE_RECIPIENT` (the swap-fee treasury) would conflate two different funds. Wire this only once that decision is made.

## The adapter interfaces

`src/lib/agent-hub/types.ts` defines three interfaces a real integration implements:

- `AgentMintAdapter` — `getMintStatus()`, `getAgentSupply(agentId)`, `getWalletMintedCount(wallet, agentId)`, `prepareRecruitment(request)`
- `AgentOwnershipAdapter` — `getOwnedAgents(wallet)`
- `PulseClaimAdapter` — `getClaimStatus(wallet)`, `getClaimableAmount(wallet)`, `prepareClaim(wallet)`

The current implementations (`src/lib/agent-hub/unconfigured*.ts`) always return empty/not-configured results and never a fake success. To go live: implement each interface against the real contracts, then swap the import in whatever page/hook currently uses the `unconfigured*` versions.

## Displaying supply

`getAgentSupply()` already returns the real, owner-configured `maxSupply` from `genesisAgentRegistry` — that part is safe to show today. `minted` stays `null` (never a guessed number) until the real adapter reads it from the collection contract. See `docs/AGENT_ECONOMY_CONFIG.md` for the "no fake mint progress" rule this enforces.

## Client-side values are never authoritative once contracts are live

Everything computed in `src/lib/agent-hub/` (pending allocation, elapsed seconds, sort order) is a client-side estimate for display only. Once real contracts exist, treat every one of these figures as advisory — the contract's own state is the only source of truth for what a wallet can actually claim. Do not skip a server/contract re-check before executing a claim just because the client-side number looks right.
