import { Reveal } from "@/features/landing/Reveal";
import { SUPPLY_BADGES, TOTAL_SUPPLY, TOKEN_SYMBOL } from "@/config/tokenomics";

/** Deterministic dot positions (no Math.random()) — same SSR-safety
 *  convention as HeroSection.tsx's ambient particles. */
const AMBIENT_DOTS = [
  { left: "10%", top: "24%", delay: 0 },
  { left: "84%", top: "18%", delay: 0.6 },
  { left: "70%", top: "72%", delay: 1.2 },
  { left: "22%", top: "80%", delay: 1.8 },
  { left: "90%", top: "50%", delay: 0.9 },
];

export function PremiumHero() {
  return (
    <div className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklch, var(--color-border) 55%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--color-border) 55%, transparent) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 35%, black 40%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--color-primary) 35%, transparent) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />
      {AMBIENT_DOTS.map((dot, i) => (
        <span
          key={i}
          className="animate-drift pointer-events-none absolute size-1 rounded-full bg-primary/60"
          style={{ left: dot.left, top: dot.top, animationDelay: `${dot.delay}s` }}
          aria-hidden="true"
        />
      ))}

      <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8 sm:py-24">
        <Reveal>
          <h1 className="font-display text-4xl tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
            ORCA Tokenomics
          </h1>
        </Reveal>
        <Reveal delayMs={100}>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
            The native utility token powering the RobinPulse ecosystem.
          </p>
        </Reveal>

        <Reveal delayMs={200}>
          <div className="relative mx-auto mt-12 inline-flex">
            <div
              className="animate-orca-glow pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-60"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklch, var(--color-primary) 45%, transparent) 0%, transparent 72%)",
                filter: "blur(28px)",
              }}
              aria-hidden="true"
            />
            <div className="glass-panel flex flex-col items-center gap-1 rounded-3xl border-primary/25 px-10 py-8 sm:px-16 sm:py-10">
              <p className="font-mono text-3xl font-semibold tabular-nums text-foreground sm:text-5xl">
                {TOTAL_SUPPLY.toLocaleString("en-US")}
              </p>
              <p className="text-sm font-semibold tracking-[0.2em] text-primary">{TOKEN_SYMBOL}</p>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={300}>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            {SUPPLY_BADGES.map((badge) => (
              <span
                key={badge}
                className="glass-panel rounded-full px-4 py-2 text-xs font-medium text-muted-foreground"
              >
                {badge}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
