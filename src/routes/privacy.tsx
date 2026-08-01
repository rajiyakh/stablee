import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderLegalPage } from "@/components/legal/PlaceholderLegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | RobinPulse" },
      {
        name: "description",
        content: "RobinPulse's Privacy Policy.",
      },
    ],
  }),
  component: () => <PlaceholderLegalPage title="Privacy Policy" />,
});
