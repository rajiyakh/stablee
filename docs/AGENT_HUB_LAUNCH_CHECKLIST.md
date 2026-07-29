# Agent Hub Launch Checklist

Everything below must be true before Agent Hub is described anywhere as "live." Do not claim recruitment, farming, or claiming is live until every applicable item here is actually done — matching this app's site-wide rule against fabricated status.

## Content review

- [ ] `src/config/genesisAgents.ts` — every `price`, `maxSupply`, `walletLimit`, `pulsePerHour`, `farmingMultiplier` reviewed and approved by whoever owns final tokenomics (see `docs/AGENT_ECONOMY_CONFIG.md`)
- [ ] `paymentTokenSymbol` confirmed correct for the actual payment asset used at mint time
- [ ] Portrait artwork (`public/agents/*.svg`) reviewed — replace any placeholder-quality art before public launch (see `docs/AGENT_ARTWORK.md`)
- [ ] `agentHubConfig.completeSetBonus` — either leave `enabled: false`, or fill in a real `bonusPercent` and confirm it before enabling

## Chain and wallet configuration

- [ ] `projectConfig.wallet` (`src/config/project.ts`) fully configured — `isWalletConfigured()` returns `true`
- [ ] `VITE_WALLETCONNECT_PROJECT_ID` set if using a self-hosted WalletConnect Cloud project

## Contract configuration

- [ ] `VITE_AGENT_COLLECTION_CONTRACT` set to a real, verified, deployed address
- [ ] `VITE_AGENT_FARMING_CONTRACT` set
- [ ] `VITE_PULSE_TOKEN_CONTRACT` set
- [ ] `pulseTokenDecimals` (`src/config/genesisAgents.ts`) matches the deployed token's actual decimals
- [ ] `contractConfig.treasury` — a real, owner-designated Agent Hub treasury address (separate from the swap-fee treasury) is set
- [ ] `AgentMintAdapter`, `AgentOwnershipAdapter` implemented against the real contracts, replacing the `unconfigured*` stubs
- [ ] `agentHubConfig.mode` moved from `"preview"` to `"allowlist"` or `"public"` only once the above is true

## TGE and claim configuration

- [ ] `tgeConfig.distributionMode` explicitly set to `"contract-claim"` or `"manual-distribution"` — never left at `"not-decided"` once TGE is scheduled
- [ ] If `"contract-claim"`: `VITE_PULSE_CLAIM_CONTRACT` set, `PulseClaimAdapter` implemented against it
- [ ] `tgeConfig.date` set to a real, officially-announced date (or left empty for "To be announced" — never a placeholder date)
- [ ] `tgeConfig.status`/`claimEnabled` only flipped to `"claim-live"`/`true` once the claim mechanism has been tested end-to-end (see below)

## Feature flags

- [ ] `VITE_AGENT_HUB_ENABLED=true` in production
- [ ] `VITE_ENABLE_AGENT_HUB_PREVIEW` — confirm this has no effect in production regardless of value (`isAgentHubPreviewEnabled()` is dev-only by construction)
- [ ] `marketplaceEnabled`/`fusionEnabled`/`transfersEnabled` — leave `false` unless that functionality has actually been built and reviewed

## Before claiming "live" anywhere (marketing copy, nav badges, etc.)

- [ ] At least one successful test recruitment has been completed end-to-end against the real contracts on the target chain
- [ ] At least one successful test claim has been completed end-to-end (if using `"contract-claim"` mode)
- [ ] `src/lib/agent-hub/deriveClaimButtonState.ts` manually verified against a real wallet in each state: disconnected, wrong network, nothing to claim, ready to claim
- [ ] Production bundle checked for accidentally-bundled secrets (see `docs/SECURITY_REVIEW.md`) — only `VITE_*` values should appear in client output, and none of them should be a private key
