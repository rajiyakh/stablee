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

/** $ORCA protocol documentation page. The premium dark section up top
 *  (`data-theme="dark"`, scoped to just this wrapper, not the whole app) is
 *  a fixed always-dark "showcase" band independent of the site's own
 *  light/dark toggle — same idea as Agent Hub's photo hero. Everything below
 *  it uses the site's normal light theme, unchanged.
 *  -mt-10 cancels PageContainer's top padding so the hero sits flush against
 *  the app header instead of showing a light gap. */
export function TokenomicsPage() {
  return (
    <div className="-mx-4 -mt-10 sm:-mx-6 lg:-mx-8">
      <div data-theme="dark" className="bg-background">
        <PremiumHero />
        <TokenAllocationSection />
        <WhyOrcaSection />
        <BuybackFlowPremium />
        <TrustBanner />
      </div>
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
