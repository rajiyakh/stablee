import { cn } from "@/lib/utils";
import { StaticPulseLogo } from "./StaticPulseLogo";
import {
  PULSE_LOGO_CIRCLE,
  PULSE_LOGO_PATH,
  PULSE_LOGO_PATH_LENGTH,
  PULSE_LOGO_VIEWBOX,
} from "./pulseLogoPath";

/**
 * The RobinPulse ECG mark: a static ring around a waveform that continuously
 * draws itself left to right (stroke-dasharray/dashoffset), with a small
 * scale pulse timed to when the draw crosses the main spike. Both effects
 * share one `--ecg-duration` custom property so hover-speedup keeps them in
 * sync — see the `ecg-draw`/`ecg-pulse` keyframes in styles.css.
 *
 * Reduced motion needs no special-casing here: the app's existing global
 * `prefers-reduced-motion` rule (styles.css) already forces every animation
 * to a near-zero duration with one iteration, and both keyframes below use
 * `animation-fill-mode: forwards`, so reduced-motion users land on the
 * fully-drawn, non-pulsing end state — a static icon, for free.
 */
export function AnimatedPulseLogo({
  size = 28,
  showWordmark = false,
  animated = true,
  className,
}: {
  size?: number;
  showWordmark?: boolean;
  animated?: boolean;
  className?: string;
}) {
  if (!animated) {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <StaticPulseLogo size={size} />
        {showWordmark ? <PulseWordmark /> : null}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2 [--ecg-duration:2.1s]", className)}>
      <svg
        width={size}
        height={size}
        viewBox={PULSE_LOGO_VIEWBOX}
        role="img"
        aria-label="RobinPulse"
        className="shrink-0"
      >
        <circle
          cx={PULSE_LOGO_CIRCLE.cx}
          cy={PULSE_LOGO_CIRCLE.cy}
          r={PULSE_LOGO_CIRCLE.r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2}
        />
        <g className="ecg-pulse-group">
          <path
            d={PULSE_LOGO_PATH}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ecg-path"
            style={{ strokeDasharray: PULSE_LOGO_PATH_LENGTH }}
          />
        </g>
      </svg>
      {showWordmark ? <PulseWordmark /> : null}
    </span>
  );
}

function PulseWordmark() {
  return (
    <span className="text-lg font-bold tracking-tight">
      <span className="text-foreground">Robin</span>
      <span className="text-primary">Pulse</span>
    </span>
  );
}
