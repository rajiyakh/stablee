import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RobinPulse — The Intelligence Layer of Robinhood Mainnet" },
      {
        name: "description",
        content:
          "RobinPulse combines AI market intelligence, live analytics, and seamless trading into one platform for Robinhood Mainnet.",
      },
      {
        property: "og:title",
        content: "RobinPulse — The Intelligence Layer of Robinhood Mainnet",
      },
      {
        property: "og:description",
        content:
          "RobinPulse combines AI market intelligence, live analytics, and seamless trading into one platform for Robinhood Mainnet.",
      },
    ],
  }),
  component: LandingPage,
});
