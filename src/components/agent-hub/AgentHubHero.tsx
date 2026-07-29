import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { agentHubConfig } from "@/config/agentHub";
import { isAgentHubContractsConfigured } from "@/config/contracts";

const STATUS_ROWS = [
  { label: "Recruitment", value: "Coming Soon" },
  { label: "Farming", value: "Begins after recruitment" },
  { label: "$PULSE Claim", value: "Locked until TGE" },
];

export function AgentHubHero() {
  const contractsConfigured = isAgentHubContractsConfigured();

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-10">
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Pre-TGE Agent Farming
        </span>

        <h1 className="mt-4 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          Recruit AI Agents. Farm Future $PULSE.
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Build your RobinPulse research team before TGE. Each Genesis Agent continuously
          accumulates future $PULSE allocation according to its farming rate.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full">
            <a href="#agents">Explore Agents</a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <a href="#how-farming-works">How Farming Works</a>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-3 border-t border-border/70 pt-6 sm:grid-cols-3">
        {STATUS_ROWS.map((row) => (
          <div key={row.label} className="rounded-xl bg-secondary/60 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {row.label}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{row.value}</p>
          </div>
        ))}
        <div className="rounded-xl bg-secondary/60 p-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Contract Status
          </p>
          <div className="mt-1.5 flex justify-center">
            <ContractStatusBadge configured={contractsConfigured} />
          </div>
        </div>
      </div>

      {agentHubConfig.mode === "preview" ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Agent Hub is in preview mode — nothing shown here is a live purchase.
        </p>
      ) : null}
    </section>
  );
}
