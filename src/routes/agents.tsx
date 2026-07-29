import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { agents, emptyAgentStats } from "@/lib/agents";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "AI analyst agents — published methodologies | RobinPulse" },
      {
        name: "description",
        content:
          "Eight specialist AI market analysts, each with a published methodology, declared inputs and stated limitations. Track records begin empty.",
      },
      { property: "og:title", content: "AI analyst agents — published methodologies" },
      {
        property: "og:description",
        content:
          "Specialist AI market analysts with published methodologies and honest, empty starting track records.",
      },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const stats = emptyAgentStats();
  return (
    <PageContainer>
      <SectionHeading
        eyebrow="Research"
        title="AI analyst agents"
        description="Each agent publishes its methodology, inputs and limitations. Performance statistics stay empty until real, scored calls exist — no historical results are simulated."
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Link
            key={agent.slug}
            to="/agents/$slug"
            params={{ slug: agent.slug }}
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <p className="text-base font-semibold text-foreground">{agent.name}</p>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {agent.role}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{agent.summary}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              Scored calls: {stats.scoredCalls} · Accuracy: {stats.accuracy ?? "Not enough data"}
            </p>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
