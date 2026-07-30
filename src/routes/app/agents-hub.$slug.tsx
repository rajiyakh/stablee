import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { AgentPortrait } from "@/components/agent-hub/AgentPortrait";
import { AgentPortraitStage } from "@/components/agent-hub/AgentPortraitStage";
import { RarityBadge } from "@/components/agent-hub/RarityBadge";
import { RecruitmentConfirmationModal } from "@/components/agent-hub/RecruitmentConfirmationModal";
import { enabledGenesisAgents, getGenesisAgent } from "@/config/genesisAgents";

export const Route = createFileRoute("/app/agents-hub/$slug")({
  head: ({ params }) => {
    const agent = getGenesisAgent(params.slug);
    const title = agent
      ? `${agent.name} — Genesis Agent | RobinPulse Agent Hub`
      : "Agent unavailable | RobinPulse Agent Hub";
    const description = agent?.shortDescription ?? "This Genesis Agent is unavailable.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(agent ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  loader: ({ params }) => {
    if (!getGenesisAgent(params.slug)) throw notFound();
    return null;
  },
  component: GenesisAgentDetailPage,
  notFoundComponent: () => (
    <PageContainer>
      <EmptyState
        title="Agent not found"
        description="No Genesis Agent exists with this identifier."
      />
    </PageContainer>
  ),
});

function GenesisAgentDetailPage() {
  const { slug } = Route.useParams();
  const agent = getGenesisAgent(slug)!;
  const related = enabledGenesisAgents().filter((a) => a.id !== agent.id);
  const [recruitOpen, setRecruitOpen] = useState(false);

  return (
    <PageContainer>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="mx-auto lg:mx-0">
          <AgentPortraitStage agent={agent} size="xl" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl tracking-tight text-foreground">{agent.name}</h1>
            <RarityBadge rarity={agent.rarity} />
          </div>
          <p className="mt-1 text-sm uppercase tracking-wide text-muted-foreground">{agent.role}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {agent.lore}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Price</dt>
              <dd className="mt-1 font-semibold tabular-nums text-foreground">
                {agent.price} {agent.paymentTokenSymbol}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Farming rate
              </dt>
              <dd className="mt-1 font-semibold tabular-nums text-foreground">
                {agent.pulsePerHour} $PULSE/hr
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Maximum supply
              </dt>
              <dd className="mt-1 font-semibold tabular-nums text-foreground">
                {agent.maxSupply.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Wallet limit
              </dt>
              <dd className="mt-1 font-semibold tabular-nums text-foreground">
                {agent.walletLimit}
              </dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">Specialties</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {agent.specialties.map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">Personality traits</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {agent.personalityTraits.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-4 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Farming overview</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Once recruited, {agent.name} continuously accumulates future $PULSE allocation at{" "}
              {agent.pulsePerHour} $PULSE per hour ({agent.farmingMultiplier}x multiplier), starting
              from its activation timestamp. Accumulated allocation remains locked until the
              official Token Generation Event and claim activation — recruitment is not currently
              live.
            </p>
          </section>

          <Button type="button" className="mt-6" onClick={() => setRecruitOpen(true)}>
            Recruitment Coming Soon
          </Button>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Other Genesis Agents
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((other) => (
              <Link
                key={other.id}
                to="/app/agents-hub/$slug"
                params={{ slug: other.slug }}
                className="rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-primary/40"
              >
                <AgentPortrait
                  src={other.avatarPath}
                  name={other.name}
                  size="sm"
                  className="mx-auto"
                />
                <p className="mt-2 text-xs font-medium text-foreground">{other.name}</p>
                <RarityBadge rarity={other.rarity} className="mt-1" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <RecruitmentConfirmationModal
        agent={recruitOpen ? agent : null}
        open={recruitOpen}
        onOpenChange={setRecruitOpen}
      />
    </PageContainer>
  );
}
