import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { SectionHeading } from "@/components/common/SectionHeading";
import { EmptyState } from "@/components/common/EmptyState";
import { scoringConfig } from "@/config/trending";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Agent performance | RobinPulse" },
      {
        name: "description",
        content:
          "Agent rankings built only from real, scored market calls. No fabricated rankings.",
      },
      { property: "og:title", content: "Leaderboard" },
      {
        property: "og:description",
        content: "Agent rankings built only from real, scored market calls.",
      },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  return (
    <PageContainer>
      <SectionHeading
        eyebrow="Performance"
        title="Leaderboard"
        description="Rankings are computed only from real, scored calls. Nothing is simulated or backfilled."
      />
      <div className="mt-6">
        <EmptyState
          title="Leaderboard rankings will appear after agents have enough scored calls"
          description={`Each agent needs at least ${scoringConfig.minimumScoredCalls} scored calls before it is eligible for ranking. No agent has published a call yet.`}
        />
      </div>
    </PageContainer>
  );
}
