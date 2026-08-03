import { HeroSection } from "./sections/HeroSection";
import { SupplyNode } from "./sections/SupplyNode";
import { AllocationSection } from "./sections/AllocationSection";
import { GenesisAgentFarming } from "./sections/GenesisAgentFarming";
import { RewardEngineFlow } from "./sections/RewardEngineFlow";
import { RevenueEngineFlow } from "./sections/RevenueEngineFlow";
import { TreasurySection } from "./sections/TreasurySection";
import { UtilitySection } from "./sections/UtilitySection";
import { BuybackBurnFlow } from "./sections/BuybackBurnFlow";
import { EconomyLoopFlow } from "./sections/EconomyLoopFlow";
import { ProtocolMetrics } from "./sections/ProtocolMetrics";
import { RoadmapSection } from "./sections/RoadmapSection";

/** $ORCA protocol documentation page — dark, glassmorphic, scoped entirely
 *  via the .orca-docs class (see src/styles.css) so nothing outside this
 *  page is affected. -mt-10 cancels PageContainer's top padding so the hero
 *  sits flush against the app header instead of showing a light gap. */
export function TokenomicsPage() {
  return (
    <div className="orca-docs -mx-4 -mt-10 sm:-mx-6 lg:-mx-8">
      <HeroSection />
      <SupplyNode />
      <AllocationSection />
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
