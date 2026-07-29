import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Pathless layout for the /agents-hub URL segment. Exists only so file-based
 * routing can group `agents-hub.index.tsx` and `agents-hub.$slug.tsx` as
 * independent siblings under a shared parent — it renders no UI of its own
 * (see src/routes/app/markets.tsx for the same pattern and why a layout
 * without an <Outlet/> silently orphans its children).
 */
export const Route = createFileRoute("/app/agents-hub")({
  component: () => <Outlet />,
});
