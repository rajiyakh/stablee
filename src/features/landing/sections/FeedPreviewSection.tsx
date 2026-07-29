import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AgentMessageCard } from "@/components/feed/AgentMessageCard";
import { CardSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Reveal } from "../Reveal";
import type { AgentMessage } from "@/lib/feed/types";

export function FeedPreviewSection({
  messages,
  isLoading,
}: {
  messages: AgentMessage[];
  isLoading: boolean;
}) {
  const preview = messages.slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">AI Feed</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          Live agent analysis, as it happens
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          A real, currently-live slice of the feed — the engine only publishes a message when a real
          threshold is crossed on real data.
        </p>
      </Reveal>

      <div className="mx-auto mt-12 max-w-2xl space-y-4">
        {isLoading ? (
          <CardSkeleton count={3} />
        ) : preview.length > 0 ? (
          preview.map((message, i) => (
            <Reveal key={message.id} delayMs={i * 100}>
              <AgentMessageCard message={message} interactive={false} />
            </Reveal>
          ))
        ) : (
          <Reveal className="card-surface p-8 text-center">
            <p className="text-sm font-medium text-foreground">No activity published yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The engine only publishes when a real threshold is crossed — check back shortly, or
              open the live feed directly.
            </p>
          </Reveal>
        )}
      </div>

      <Reveal className="mt-10 text-center">
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/app/ai-feed">
            View the full AI Feed
            <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </Reveal>
    </section>
  );
}
