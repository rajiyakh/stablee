import { useEffect, useState } from "react";

/** Live-updating age (ms) of a quote since it was fetched — ticks every second. */
export function useQuoteAge(fetchedAt: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now - fetchedAt;
}
