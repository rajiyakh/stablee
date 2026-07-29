import { cn } from "@/lib/utils";

/**
 * Ambient background texture only — not a data widget. No price labels, no
 * token symbols, no numbers attached. Heights/colors/delays are a fixed,
 * hand-authored sequence (not Math.random()) so server and client render
 * identically and hydration never mismatches.
 */
const BARS = [
  { h: 38, up: true, delay: 0 },
  { h: 62, up: true, delay: 0.15 },
  { h: 28, up: false, delay: 0.3 },
  { h: 71, up: true, delay: 0.45 },
  { h: 45, up: false, delay: 0.6 },
  { h: 55, up: true, delay: 0.75 },
  { h: 33, up: false, delay: 0.9 },
  { h: 80, up: true, delay: 1.05 },
  { h: 48, up: true, delay: 1.2 },
  { h: 60, up: false, delay: 1.35 },
  { h: 40, up: true, delay: 1.5 },
  { h: 67, up: true, delay: 1.65 },
  { h: 30, up: false, delay: 1.8 },
  { h: 74, up: true, delay: 1.95 },
  { h: 52, up: false, delay: 2.1 },
  { h: 44, up: true, delay: 2.25 },
  { h: 63, up: true, delay: 2.4 },
  { h: 36, up: false, delay: 2.55 },
  { h: 58, up: true, delay: 2.7 },
  { h: 25, up: false, delay: 2.85 },
] as const;

export function DecorativeCandles({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-end gap-[3px]", className)}
      role="presentation"
      aria-hidden="true"
    >
      {BARS.map((bar, i) => (
        <span
          key={i}
          className="animate-candle w-full rounded-[2px]"
          style={{
            height: `${bar.h}%`,
            animationDelay: `${bar.delay}s`,
            backgroundColor: bar.up
              ? "color-mix(in oklch, var(--color-positive) 55%, var(--color-brand))"
              : "var(--color-negative)",
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}
