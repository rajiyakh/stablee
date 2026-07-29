import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Reveal } from "../Reveal";

export function ProtocolSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Protocol</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          A future protocol token
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          RobinPulse is evaluating a future protocol token as a way to connect the platform's AI
          intelligence, community participation, and long-term incentive design into a single layer.
          No tokenomics, supply, or price have been decided, and none are promised — this is a
          direction we're exploring, not a commitment on a timeline.
        </p>
        <Link
          to="/app/token"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Learn more
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Reveal>
    </section>
  );
}
