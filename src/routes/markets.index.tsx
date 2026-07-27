import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/markets/")({
  beforeLoad: () => {
    throw redirect({ to: "/markets/trending", search: { interval: "1h" } });
  },
});
