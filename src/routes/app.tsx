import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Layout route for the whole application — everything under /app/* gets the
 * app chrome (header/ticker/sidebar/footer) via AppShell. The landing page
 * at "/" is a sibling, not a child, and renders its own minimal chrome
 * instead (see routes/index.tsx).
 */
export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
