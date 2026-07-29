import { AnimatedPulseLogo } from "./AnimatedPulseLogo";

/**
 * Full-viewport centered splash composition. Exported for future use (e.g.
 * a wallet-connect boot moment) but deliberately not mounted anywhere by
 * default — this is an SSR app, so forcing this on every load would flash
 * before the already-server-rendered content, with no upside.
 */
export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <AnimatedPulseLogo size={64} showWordmark />
    </div>
  );
}
