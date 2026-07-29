import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Pathless layout for the /token URL segment. Exists only so file-based
 * routing can group `token.index.tsx` (the /token announcement page) and
 * `token.$chainId.$address.tsx` (the on-chain token detail page) as
 * independent siblings under a shared parent — it renders no UI of its own.
 */
export const Route = createFileRoute("/app/token")({
  component: () => <Outlet />,
});
