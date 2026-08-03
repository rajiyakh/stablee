import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { agentHubConfig } from "@/config/agentHub";
import { isAgentHubContractsConfigured } from "@/config/contracts";

const STATUS_ROWS = [
  { label: "Minting", value: "Coming Soon" },
  { label: "Farming", value: "Begins after minting" },
  { label: "$ORCA Claim", value: "Locked until TGE" },
];

export function AgentHubHero() {
  const contractsConfigured = isAgentHubContractsConfigured();

  return (
    <section className="relative py-6 sm:py-10">
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary backdrop-blur">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Pre-TGE Agent Farming
        </span>

        <h1 className="mt-3 font-display text-3xl tracking-tight text-white sm:text-4xl">
          Mint AI Agents. Farm Future $ORCA.
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
          Build your RobinPulse research team before TGE. Each Genesis Agent continuously
          accumulates future $ORCA allocation according to its farming rate.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full">
            <a href="#agents">Explore Agents</a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <a href="#how-farming-works">How Farming Works</a>
          </Button>
        </div>
      </div>

      <div className="relative mt-6 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-3">
        {STATUS_ROWS.map((row) => (
          <div key={row.label} className="rounded-xl bg-black/25 p-4 text-center backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
              {row.label}
            </p>
            <p className="mt-1 text-sm font-medium text-white">{row.value}</p>
          </div>
        ))}
        <div className="rounded-xl bg-black/25 p-4 text-center backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
            Contract Status
          </p>
          <div className="mt-1.5 flex justify-center">
            <ContractStatusBadge configured={contractsConfigured} />
          </div>
        </div>
      </div>

      {agentHubConfig.mode === "preview" ? (
        <p className="relative mt-3 text-center text-xs text-white/60">
          Agent Hub is in preview mode — nothing shown here is a live purchase.
        </p>
      ) : null}
    </section>
  );
}
