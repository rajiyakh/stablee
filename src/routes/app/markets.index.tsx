import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/markets/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/markets/trending", search: { interval: "1h" } });
  },
});
