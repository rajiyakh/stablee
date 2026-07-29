import { cn } from "@/lib/utils";
import { PULSE_LOGO_CIRCLE, PULSE_LOGO_PATH, PULSE_LOGO_VIEWBOX } from "./pulseLogoPath";

/**
 * Non-animated rendering of the RobinPulse mark — fully-drawn waveform, no
 * glow-pulse, no dash animation. Used by AnimatedPulseLogo when
 * `animated={false}`, and standalone anywhere a static icon is preferable
 * (e.g. tiny inline usages, print, or contexts outside React entirely —
 * public/favicon.svg mirrors this markup by hand for that reason).
 */
export function StaticPulseLogo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={PULSE_LOGO_VIEWBOX}
      role="img"
      aria-label="RobinPulse"
      className={cn("shrink-0", className)}
    >
      <circle
        cx={PULSE_LOGO_CIRCLE.cx}
        cy={PULSE_LOGO_CIRCLE.cy}
        r={PULSE_LOGO_CIRCLE.r}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2}
      />
      <path
        d={PULSE_LOGO_PATH}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
