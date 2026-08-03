import { Reveal } from "@/features/landing/Reveal";

/** Deterministic dot positions (no Math.random()) — same SSR-safety
 *  convention as the landing page's hero particles. */
const AMBIENT_DOTS = [
  { left: "12%", top: "22%", delay: 0 },
  { left: "82%", top: "16%", delay: 0.6 },
  { left: "68%", top: "70%", delay: 1.2 },
  { left: "24%", top: "78%", delay: 1.8 },
  { left: "92%", top: "52%", delay: 0.9 },
  { left: "6%", top: "55%", delay: 1.5 },
];

export function HeroSection() {
  return (
    <div className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklch, var(--color-border) 55%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--color-border) 55%, transparent) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)",
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

      <div className="relative mx-auto max-w-4xl px-4 py-28 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            AI Market Intelligence Protocol
          </p>
        </Reveal>
        <Reveal delayMs={100}>
          <h1 className="mt-5 font-display text-5xl tracking-tight text-foreground text-balance sm:text-6xl lg:text-7xl">
            ORCA Tokenomics
          </h1>
        </Reveal>
        <Reveal delayMs={200}>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            The Utility Token Powering RobinPulse AI Infrastructure
          </p>
        </Reveal>
        <Reveal delayMs={300}>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground/90 sm:text-base">
            ORCA powers the RobinPulse ecosystem through AI intelligence, trading infrastructure,
            protocol incentives and future governance.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
