import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Fixed-height vertical connector: a static line, an animated draw-in
 *  overlay, and a small glowing "packet" dot traveling along it on a loop —
 *  deterministic (no DOM measurement), so it composes cleanly between any
 *  two stacked nodes. */
function VerticalConnector({ height = 56 }: { height?: number }) {
  return (
    <div className="relative flex justify-center" style={{ height }} aria-hidden="true">
      <svg width="2" height={height} className="overflow-visible text-border">
        <line
          x1="1"
          y1="0"
          x2="1"
          y2={height}
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="1"
          y1="0"
          x2="1"
          y2={height}
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          strokeDasharray={height}
          className="animate-orca-line"
          style={{ ["--orca-line-length" as string]: height }}
        />
      </svg>
      <span
        className="animate-orca-packet absolute left-1/2 top-0 size-1.5 -translate-x-1/2 rounded-full bg-primary"
        style={{
          offsetPath: `path("M1,0 L1,${height}")`,
          boxShadow: "0 0 8px var(--color-primary)",
        }}
      />
      <ChevronDown className="absolute -bottom-1 left-1/2 size-3 -translate-x-1/2 text-primary" />
    </div>
  );
}

function FlowNode({ index, label }: { index: number; label: string }) {
  return (
    <div className="glass-panel flex w-full max-w-md items-center gap-3 px-5 py-3.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold tabular-nums text-primary">
        {index + 1}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}

function VerticalFlow({ steps, className }: { steps: string[]; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      {steps.map((step, i) => (
        <div key={step} className="flex flex-col items-center">
          <FlowNode index={i} label={step} />
          {i < steps.length - 1 ? <VerticalConnector /> : null}
        </div>
      ))}
    </div>
  );
}

/** Steps arranged evenly around a ring, with a continuously-drawn circular
 *  connector and a packet traveling the full loop — used for Buyback &
 *  Burn's explicitly-requested "circular animated flow." Positions are
 *  computed via trig at render time (deterministic, no Math.random()), same
 *  SSR-safety convention as the landing page's decorative particles. */
function CircularFlow({ steps, className }: { steps: string[]; className?: string }) {
  const size = 420;
  const radius = 165;
  const center = size / 2;

  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[420px]", className)}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="text-border"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          strokeDasharray={2 * Math.PI * radius}
          className="animate-orca-line"
          style={{ ["--orca-line-length" as string]: 2 * Math.PI * radius }}
        />
      </svg>
      <span
        className="animate-orca-packet absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
        style={{
          offsetPath: `path("M ${center + radius},${center} a ${radius},${radius} 0 1,0 -${
            2 * radius
          },0 a ${radius},${radius} 0 1,0 ${2 * radius},0")`,
          boxShadow: "0 0 10px var(--color-primary)",
        }}
      />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center text-muted-foreground">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Long-term</span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em]">Scarcity Loop</span>
      </div>
      {steps.map((step, i) => {
        const angle = (2 * Math.PI * i) / steps.length - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <div
            key={step}
            className="glass-panel absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-2 text-xs font-medium text-foreground"
            style={{ left: `${(x / size) * 100}%`, top: `${(y / size) * 100}%` }}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
}

export function FlowDiagram({
  steps,
  variant = "vertical",
  className,
}: {
  steps: string[];
  variant?: "vertical" | "circular";
  className?: string;
}) {
  if (variant === "circular") {
    // The circular layout's whitespace-nowrap step labels need real room to
    // fan out around the ring — below `sm` there isn't enough width for
    // that without labels running off-screen, so mobile gets the vertical
    // layout instead (same steps, still a real flow, no overflow).
    return (
      <>
        <CircularFlow steps={steps} className={cn("hidden sm:block", className)} />
        <VerticalFlow steps={steps} className={cn("sm:hidden", className)} />
      </>
    );
  }
  return <VerticalFlow steps={steps} className={className} />;
}
