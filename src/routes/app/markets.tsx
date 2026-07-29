import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Pathless layout for the /markets URL segment. Exists only so file-based
 * routing can group `markets.index.tsx`, `markets.trending.tsx`,
 * `markets.hot-searches.tsx`, `markets.global.tsx`, and
 * `markets.robinhood.$tokenAddress.tsx` as independent siblings under a
 * shared parent — it renders no UI of its own (see src/routes/token.tsx for
 * the same pattern and why a layout without an <Outlet/> silently orphans
 * its children).
 */
export const Route = createFileRoute("/app/markets")({
  component: () => <Outlet />,
});
