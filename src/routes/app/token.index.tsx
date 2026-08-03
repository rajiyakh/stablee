import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { TokenomicsPage } from "@/features/tokenomics/TokenomicsPage";

const DESCRIPTION =
  "ORCA powers the RobinPulse ecosystem through AI intelligence, trading infrastructure, protocol incentives and future governance.";

export const Route = createFileRoute("/app/token/")({
  head: () => ({
    meta: [
      { title: "ORCA Tokenomics | RobinPulse" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "ORCA Tokenomics — RobinPulse" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: TokenPage,
});

function TokenPage() {
  return (
    <PageContainer>
      <TokenomicsPage />
    </PageContainer>
  );
}
