/**
 * Shared ECG waveform geometry for the RobinPulse logo mark, used by both
 * AnimatedPulseLogo and StaticPulseLogo (and the standalone favicon.svg,
 * which mirrors this by hand since favicons can't run React).
 *
 * Straight-line segments only (no curves) so the path length below is
 * exactly computable for stroke-dasharray, and stays crisp at any size.
 * Defined left to right so the natural stroke-dashoffset draw direction
 * needs no reversal. viewBox is a fixed 48x48 regardless of render size.
 */
export const PULSE_LOGO_VIEWBOX = "0 0 48 48";
export const PULSE_LOGO_CIRCLE = { cx: 24, cy: 24, r: 20 };
export const PULSE_LOGO_PATH = "M11,24 L16.2,24 L20.1,12.3 L27.9,35.7 L31.8,24 L37,24";
/** Sum of the path's segment lengths — used for stroke-dasharray/dashoffset. */
export const PULSE_LOGO_PATH_LENGTH = 60;
