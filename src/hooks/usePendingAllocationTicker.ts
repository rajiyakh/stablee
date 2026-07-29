import { useEffect, useState } from "react";

/**
 * Returns a locally-ticking "now" — never a network/API request. Recomputes
 * once a second normally, once every 30s under prefers-reduced-motion, and
 * pauses entirely while the tab is hidden. Consumers combine this with
 * computeElapsedActiveSeconds()/calculatePendingAllocation() to derive a
 * live-feeling but purely local pending-allocation figure from the last
 * trusted snapshot.
 */
export function usePendingAllocationTicker(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tickMs = prefersReducedMotion ? 30_000 : 1_000;

    let intervalId: number | undefined;
    const startTicking = () => {
      intervalId = window.setInterval(() => setNow(new Date()), tickMs);
    };
    const stopTicking = () => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTicking();
      } else {
        setNow(new Date());
        startTicking();
      }
    };

    if (!document.hidden) startTicking();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      stopTicking();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return now;
}
