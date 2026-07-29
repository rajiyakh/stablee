import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { feedSnapshotQuery } from "@/lib/feed/client";
import { LandingHeader } from "./LandingHeader";
import { LandingFooter } from "./LandingFooter";
import { HeroSection } from "./sections/HeroSection";

// Lazy: keeps the initial landing bundle to just the hero + header. Each
// section is small, but splitting still avoids parsing/executing the rest
// of the page before the fold is interactive.
const WhatIsSection = lazy(() =>
  import("./sections/WhatIsSection").then((m) => ({ default: m.WhatIsSection })),
);
const FeaturesSection = lazy(() =>
  import("./sections/FeaturesSection").then((m) => ({ default: m.FeaturesSection })),
);
const TerminalPreviewSection = lazy(() =>
  import("./sections/TerminalPreviewSection").then((m) => ({
    default: m.TerminalPreviewSection,
  })),
);
const AgentsSection = lazy(() =>
  import("./sections/AgentsSection").then((m) => ({ default: m.AgentsSection })),
);
const FeedPreviewSection = lazy(() =>
  import("./sections/FeedPreviewSection").then((m) => ({ default: m.FeedPreviewSection })),
);
const RoadmapSection = lazy(() =>
  import("./sections/RoadmapSection").then((m) => ({ default: m.RoadmapSection })),
);
const ProtocolSection = lazy(() =>
  import("./sections/ProtocolSection").then((m) => ({ default: m.ProtocolSection })),
);
const FinalCtaSection = lazy(() =>
  import("./sections/FinalCtaSection").then((m) => ({ default: m.FinalCtaSection })),
);

function SectionFallback() {
  return <div className="min-h-[420px]" aria-hidden="true" />;
}

export function LandingPage() {
  // Single shared fetch — every section that needs real data reads from
  // this one query instead of each firing its own request.
  const feed = useQuery({ ...feedSnapshotQuery(), refetchIntervalInBackground: false });
  const snapshot = feed.data;
  const trendingTokens = snapshot?.trendingTokens ?? [];
  const messages = snapshot?.messages ?? [];

  return (
    <div data-theme="light" className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <HeroSection tickerTokens={trendingTokens} />

        <Suspense fallback={<SectionFallback />}>
          <WhatIsSection trendingTokens={trendingTokens} isLoading={feed.isPending} />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <FeaturesSection />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <TerminalPreviewSection trendingTokens={trendingTokens} isLoading={feed.isPending} />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <AgentsSection />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <FeedPreviewSection messages={messages} isLoading={feed.isPending} />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <RoadmapSection />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <ProtocolSection />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <FinalCtaSection />
        </Suspense>
      </main>
      <LandingFooter />
    </div>
  );
}
