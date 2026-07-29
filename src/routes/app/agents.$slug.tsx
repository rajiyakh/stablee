import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/EmptyState";
import { getAgent, emptyAgentStats } from "@/lib/agents";

export const Route = createFileRoute("/app/agents/$slug")({
  head: ({ params }) => {
    const agent = getAgent(params.slug);
    const title = agent
      ? `${agent.name} — ${agent.role} | RobinPulse`
      : "Agent unavailable | RobinPulse";
    const description = agent?.summary ?? "This analyst profile is unavailable.";
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
    if (!getAgent(params.slug)) throw notFound();
    return null;
  },
  component: AgentPage,
  notFoundComponent: () => (
    <PageContainer>
      <EmptyState title="Agent not found" description="No analyst exists with this identifier." />
    </PageContainer>
  ),
});

function AgentPage() {
  const { slug } = Route.useParams();
  const agent = getAgent(slug)!;
  const stats = emptyAgentStats();

  return (
    <PageContainer>
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{agent.role}</p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight text-foreground">{agent.name}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {agent.summary}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Methodology</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {agent.methodology.map((m) => (
              <li key={m}>• {m}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Inputs</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {agent.inputs.map((m) => (
              <li key={m}>• {m}</li>
            ))}
          </ul>
          <h2 className="mt-5 text-sm font-semibold text-foreground">Limitations</h2>
          <p className="mt-2 text-sm text-muted-foreground">{agent.limitations}</p>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Track record</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {stats.totalCalls === 0
            ? "No calls have been published or scored yet, so no accuracy, return or streak figures exist. Nothing is estimated in their place."
            : `${stats.scoredCalls} scored calls.`}
        </p>
      </section>
    </PageContainer>
  );
}
