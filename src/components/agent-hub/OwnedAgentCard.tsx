import { Button } from "@/components/ui/button";
import { AgentPortrait } from "./AgentPortrait";
import { RarityBadge } from "./RarityBadge";
import { FarmingStatusBadge } from "./FarmingStatusBadge";
import { PendingAllocationCounter } from "./PendingAllocationCounter";
import { CLAIM_BUTTON_LABEL, deriveClaimButtonState } from "@/lib/agent-hub/deriveClaimButtonState";
import { relativeTime } from "@/lib/market/format";
import type { GenesisAgentConfig } from "@/config/genesisAgents";
import type { OwnedAgentPosition } from "@/lib/agent-hub/types";

export function OwnedAgentCard({
  position,
  agent,
  isWalletConnected,
  isWrongNetwork,
  pendingAmount,
}: {
  position: OwnedAgentPosition;
  agent: GenesisAgentConfig;
  isWalletConnected: boolean;
  isWrongNetwork: boolean;
  pendingAmount: string;
}) {
  const claimState = deriveClaimButtonState({
    isWalletConnected,
    isWrongNetwork,
    pendingAmount,
    isClaiming: false,
    justClaimed: false,
  });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card backdrop-blur-md p-4 sm:flex-row sm:items-center">
      <AgentPortrait src={agent.avatarPath} name={agent.name} size="sm" />

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">{agent.name}</p>
          <RarityBadge rarity={agent.rarity} />
          {position.tokenId ? (
            <span className="text-xs text-muted-foreground">#{position.tokenId}</span>
          ) : null}
          <FarmingStatusBadge status={position.status} />
        </div>

        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
          <div>
            <dt className="uppercase tracking-wide">Acquired</dt>
            <dd className="text-foreground">{relativeTime(position.acquiredAt)}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Farming since</dt>
            <dd className="text-foreground">{relativeTime(position.activatedAt)}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Daily rate</dt>
            <dd className="text-foreground">{agent.pulsePerDay} $ORCA/day</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Claimed</dt>
            <dd className="text-foreground">{position.claimedPulse} $ORCA</dd>
          </div>
        </dl>

        <div className="mt-2">
          <PendingAllocationCounter position={position} dailyRate={agent.pulsePerDay} />
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:w-40">
        <Button type="button" disabled={claimState !== "claim-ready"} className="w-full">
          {CLAIM_BUTTON_LABEL[claimState]}
        </Button>
      </div>
    </div>
  );
}
