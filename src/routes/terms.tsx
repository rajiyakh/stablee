import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderLegalPage } from "@/components/legal/PlaceholderLegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | RobinPulse" },
      {
        name: "description",
        content: "RobinPulse's Terms & Conditions.",
      },
    ],
  }),
  component: () => <PlaceholderLegalPage title="Terms & Conditions" />,
});
