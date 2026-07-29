import { Check, Clock } from "lucide-react";
import { Reveal } from "../Reveal";

const current = ["AI Feed", "Markets", "Market Intelligence", "Swap", "Portfolio"];
const upcoming = ["Protocol Token", "Mobile App", "Public API"];

export function RoadmapSection() {
  return (
    <section id="roadmap" className="border-y border-border/70 bg-card/30">
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Roadmap</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Where the platform stands today
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          <Reveal>
            <div className="card-surface h-full p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-positive">
                <Check className="h-4 w-4" aria-hidden="true" />
                Current
              </h3>
              <ul className="mt-4 space-y-3">
                {current.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delayMs={150}>
            <div className="card-surface h-full p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock className="h-4 w-4" aria-hidden="true" />
                Upcoming
              </h3>
              <ul className="mt-4 space-y-3">
                {upcoming.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-border" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
