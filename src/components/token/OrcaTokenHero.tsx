import { Button } from "@/components/ui/button";
import { DecorativeCandles } from "@/features/landing/DecorativeCandles";

/** Fixed, deterministic ripple rings — no Math.random() (SSR hydration safety). */
const RIPPLE_RINGS = [
  { delay: "0s", width: 90 },
  { delay: "1.1s", width: 90 },
  { delay: "2.2s", width: 90 },
] as const;

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-x-0 top-0 -z-10 h-64 opacity-40"
        style={{
          background: "radial-gradient(circle at 30% 0%, var(--color-brand) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-40 opacity-[0.06]">
        <DecorativeCandles className="h-full px-6" />
      </div>
      <svg
        className="absolute inset-x-0 bottom-10 h-36 w-full opacity-[0.07]"
        viewBox="0 0 800 160"
        preserveAspectRatio="none"
        role="presentation"
      >
        <g fill="var(--color-foreground)">
          <rect x="10" y="90" width="28" height="70" />
          <rect x="46" y="55" width="22" height="105" />
          <rect x="76" y="100" width="32" height="60" />
          <rect x="118" y="35" width="20" height="125" />
          <rect x="148" y="78" width="28" height="82" />
          <rect x="184" y="112" width="24" height="48" />
          <rect x="672" y="70" width="24" height="90" />
          <rect x="700" y="28" width="18" height="132" />
          <rect x="724" y="88" width="28" height="72" />
          <rect x="758" y="100" width="22" height="60" />
        </g>
      </svg>
      <svg
        className="absolute inset-x-0 bottom-10 h-36 w-full opacity-[0.16]"
        viewBox="0 0 800 160"
        preserveAspectRatio="none"
        role="presentation"
      >
        <path
          d="M0 140 L100 130 L180 92 L260 112 L340 62 L420 78 L500 32 L580 52 L660 16 L740 36 L800 12"
          fill="none"
          stroke="var(--color-positive)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-trend-line"
          style={{ strokeDasharray: 900 }}
        />
      </svg>
    </div>
  );
}

function OrcaMascot() {
  return (
    <div className="relative flex items-center justify-center px-2 pb-14 pt-8 lg:pt-2">
      <div
        className="animate-agent-glow pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, var(--color-agent-cyan) 0%, transparent 65%)",
          filter: "blur(30px)",
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl lg:max-w-2xl">
        <img
          src="/token/orca-mascot.webp"
          alt="$ORCA — the RobinPulse Ocean Intelligence orca mascot leaping above the water"
          width={1280}
          height={853}
          loading="eager"
          fetchPriority="high"
          className="animate-orca-float relative z-10 h-auto w-full rounded-3xl object-contain drop-shadow-2xl"
          style={{
            maskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 86%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 100% 100% at 50% 50%, black 86%, transparent 100%)",
          }}
        />

        <div
          className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2"
          aria-hidden="true"
        >
          <span
            className="block rounded-full bg-primary/15 blur-md"
            style={{ width: 150, height: 26 }}
          />
          {RIPPLE_RINGS.map((ring) => (
            <span
              key={ring.delay}
              className="animate-ripple absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/35"
              style={{ width: ring.width, height: ring.width / 3, animationDelay: ring.delay }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function OrcaTokenHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-10">
      <HeroBackground />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
        <div className="text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            RobinPulse
          </p>
          <h1 className="mt-2 font-display text-6xl tracking-tight text-foreground sm:text-7xl">
            $ORCA
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            The native utility token of RobinPulse.
            <br />
            Powered by the Ocean Intelligence Network.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button size="lg" disabled className="rounded-full px-8">
              Buy $ORCA
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <a href="#token-information">Tokenomics</a>
            </Button>
          </div>
        </div>

        <OrcaMascot />
      </div>
    </section>
  );
}
