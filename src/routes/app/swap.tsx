import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Pathless layout for the /swap URL segment — mirrors src/routes/token.tsx
 * and src/routes/markets.tsx's established pattern (a layout without an
 * <Outlet/> silently orphans its children in TanStack Router's file-based
 * routing). Renders no UI of its own.
 */
export const Route = createFileRoute("/app/swap")({
  component: () => <Outlet />,
});
