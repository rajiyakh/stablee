import { Users } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionHeading } from "@/components/common/SectionHeading";
import { OwnedAgentCard } from "./OwnedAgentCard";
import { PreviewDataBadge } from "./PreviewDataBadge";
import {
  calculatePendingAllocation,
  calculatePendingAllocationBaseUnits,
  sumPendingAllocationBaseUnits,
} from "@/lib/agent-hub/calculatePendingAllocation";
import { computeElapsedActiveSeconds } from "@/lib/agent-hub/computeElapsedActiveSeconds";
import { getGenesisAgent, pulseTokenDecimals } from "@/config/genesisAgents";
import { formatUnits } from "viem";
import type { OwnedAgentPosition } from "@/lib/agent-hub/types";

export function MyAgentsDashboard({
  positions,
  isPreviewData,
  isWalletConnected,
  isWrongNetwork,
}: {
  positions: OwnedAgentPosition[];
  isPreviewData: boolean;
  isWalletConnected: boolean;
  isWrongNetwork: boolean;
}) {
  const knownPositions = positions
    .map((position) => ({ position, agent: getGenesisAgent(position.agentId) }))
    .filter((p): p is { position: OwnedAgentPosition; agent: NonNullable<typeof p.agent> } =>
      Boolean(p.agent),
    );

  const activeFarmers = knownPositions.filter((p) => p.position.status === "farming").length;

  const dailyRateTotal = knownPositions.reduce(
    (total, { position, agent }) =>
      position.status === "farming" ? total + Number(agent.pulsePerDay) : total,
    0,
  );

  const pendingBaseUnits = sumPendingAllocationBaseUnits(
    knownPositions.map(({ position, agent }) =>
      calculatePendingAllocationBaseUnits(computeElapsedActiveSeconds(position), agent.pulsePerDay),
    ),
  );
  const pendingTotal = formatUnits(pendingBaseUnits, pulseTokenDecimals);

  const claimedTotal = knownPositions.reduce(
    (total, { position }) => total + Number(position.claimedPulse || "0"),
    0,
  );

  const stats = [
    { label: "My Agents", value: knownPositions.length.toString() },
    { label: "Active Farmers", value: activeFarmers.toString() },
    { label: "Daily Farming Rate", value: `${dailyRateTotal} $ORCA/day` },
    {
      label: "Pending $ORCA",
      value: `${Number(pendingTotal).toLocaleString(undefined, { maximumFractionDigits: 4 })}`,
    },
    { label: "Claimed $ORCA", value: claimedTotal.toString() },
    { label: "Claim Status", value: "Locked until TGE" },
  ];

  return (
    <section id="my-agents">
      <SectionHeading
        eyebrow="Your Team"
        title="My Agents"
        action={isPreviewData && knownPositions.length > 0 ? <PreviewDataBadge /> : undefined}
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {knownPositions.length === 0 ? (
          <EmptyState
            icon={<Users className="size-6" />}
            title="Your research team is empty."
            description="Minting has not opened yet. Explore the Genesis Agents and prepare your future team."
          />
        ) : (
          <div className="space-y-3">
            {knownPositions.map(({ position, agent }) => (
              <OwnedAgentCard
                key={position.ownershipId}
                position={position}
                agent={agent}
                isWalletConnected={isWalletConnected}
                isWrongNetwork={isWrongNetwork}
                pendingAmount={calculatePendingAllocation(
                  computeElapsedActiveSeconds(position),
                  agent.pulsePerDay,
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
