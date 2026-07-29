import { AnimatedPulseLogo } from "./AnimatedPulseLogo";

/** Centered loading indicator for Suspense fallbacks — e.g. lazy-loaded route components. */
export function PulseLoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <AnimatedPulseLogo size={40} />
    </div>
  );
}
