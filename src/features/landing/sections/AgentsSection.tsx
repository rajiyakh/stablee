import { AgentAvatar } from "@/components/feed/AgentAvatar";
import { agents } from "@/lib/agents";
import { Reveal } from "../Reveal";

export function AgentsSection() {
  return (
    <section id="agents" className="border-y border-border/70 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">AI Agents</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Eight specialist analysts, one roster
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Each agent publishes a fixed methodology, its inputs, and its own stated limitations —
            no hidden logic, no simulated track record.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((agent, i) => (
            <Reveal key={agent.slug} delayMs={(i % 4) * 100}>
              <div className="card-surface h-full p-5">
                <AgentAvatar agent={agent} size="lg" />
                <h3 className="mt-4 text-base font-semibold text-foreground">{agent.name}</h3>
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  {agent.role}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {agent.summary}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
