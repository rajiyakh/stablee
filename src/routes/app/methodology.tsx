import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { trendingConfig } from "@/config/trending";

export const Route = createFileRoute("/app/methodology")({
  head: () => ({
    meta: [
      { title: "Trend score methodology | RobinPulse" },
      {
        name: "description",
        content:
          "The exact inputs, weights and safeguards used to compute the RobinPulse trend score from real market data.",
      },
      { property: "og:title", content: "Trend score methodology" },
      {
        property: "og:description",
        content: "Exact inputs, weights and safeguards behind the RobinPulse trend score.",
      },
    ],
  }),
  component: MethodologyPage,
});

function MethodologyPage() {
  const weights = Object.entries(trendingConfig.weights ?? {});
  return (
    <PageContainer>
      <SectionHeading
        eyebrow="Transparency"
        title="How the trend score works"
        description="The score is a weighted combination of real, provider-reported metrics. Components with missing data are excluded rather than filled in, and a score is withheld entirely when too little data exists."
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card backdrop-blur-sm p-5">
          <h2 className="text-sm font-semibold text-foreground">Component weights</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {weights.map(([key, value]) => (
              <li key={key} className="flex justify-between">
                <span>{key}</span>
                <span className="tabular-nums">{String(value)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-card backdrop-blur-sm p-5">
          <h2 className="text-sm font-semibold text-foreground">Safeguards</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {Object.entries(trendingConfig.safeguards ?? {}).map(([key, value]) => (
              <li key={key} className="flex justify-between">
                <span>{key}</span>
                <span className="tabular-nums">{String(value)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Promotional boosts are reported as a separate, clearly labelled factor and never
            contribute to the score.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
