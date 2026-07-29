import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/xstocks")({
  beforeLoad: () => {
    throw redirect({ to: "/app/agents-hub" });
  },
});
