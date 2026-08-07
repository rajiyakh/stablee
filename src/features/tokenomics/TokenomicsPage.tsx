import { PremiumHero } from "./sections/PremiumHero";
import { TokenAllocationSection } from "./sections/TokenAllocationSection";
import { WhyOrcaSection } from "./sections/WhyOrcaSection";
import { BuybackFlowPremium } from "./sections/BuybackFlowPremium";
import { TrustBanner } from "./sections/TrustBanner";
import { GenesisAgentFarming } from "./sections/GenesisAgentFarming";
import { RewardEngineFlow } from "./sections/RewardEngineFlow";
import { RevenueEngineFlow } from "./sections/RevenueEngineFlow";
import { TreasurySection } from "./sections/TreasurySection";
import { UtilitySection } from "./sections/UtilitySection";
import { BuybackBurnFlow } from "./sections/BuybackBurnFlow";
import { EconomyLoopFlow } from "./sections/EconomyLoopFlow";
import { ProtocolMetrics } from "./sections/ProtocolMetrics";
import { RoadmapSection } from "./sections/RoadmapSection";

/** $ORCA protocol documentation page. The premium section up top (Hero
 *  through Trust Banner) uses only theme-aware utilities/CSS variables, so
 *  it follows the site's own light/dark toggle exactly like the rest of the
 *  page — no local theme override.
 *  -mt-10 cancels PageContainer's top padding so the hero sits flush against
 *  the app header instead of showing a light gap. */
export function TokenomicsPage() {
  return (
    <div className="-mx-4 -mt-10 sm:-mx-6 lg:-mx-8">
      <PremiumHero />
      <TokenAllocationSection />
      <WhyOrcaSection />
      <BuybackFlowPremium />
      <TrustBanner />
      <GenesisAgentFarming />
      <RewardEngineFlow />
      <RevenueEngineFlow />
      <TreasurySection />
      <UtilitySection />
      <BuybackBurnFlow />
      <EconomyLoopFlow />
      <ProtocolMetrics />
      <RoadmapSection />
    </div>
  );
}
