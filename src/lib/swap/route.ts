/**
 * 0x's route.fills[].source is a raw internal identifier (e.g. "Uniswap_V3",
 * "LiquidCore") — humanized for display, never fabricated when the field is
 * absent. A route can split across multiple sources; all distinct sources
 * are shown, not just the first fill.
 */
export function humanizeRouteSources(
  route: { fills?: Array<{ source?: string }> } | undefined,
): string | null {
  if (!route?.fills?.length) return null;
  const sources = [
    ...new Set(route.fills.map((f) => f.source).filter((s): s is string => Boolean(s))),
  ];
  if (sources.length === 0) return null;
  return sources.map((s) => s.replace(/_/g, " ")).join(" + ");
}
