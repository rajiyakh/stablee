import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SwapPage } from "@/features/swap/SwapPage";
import { BridgePage } from "@/features/bridge/BridgePage";

export type TradeTab = "swap" | "bridge";

/**
 * Reproduces the exact pill visuals SwapPage previously hardcoded
 * (active: bg-card + font-display + shadow-sm; inactive:
 * text-muted-foreground/60) via Radix Tabs' data-[state] attributes,
 * cn()-merged over tabs.tsx's own defaults rather than editing that shared
 * primitive.
 */
const PILL =
  "rounded-full px-3 py-1 text-sm font-medium text-muted-foreground/60 shadow-none transition-colors " +
  "data-[state=active]:bg-card data-[state=active]:font-display data-[state=active]:text-sm " +
  "data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-sm";

export function TradePanel({
  initialTab,
  initialBuyAddress,
  initialSellAddress,
}: {
  initialTab: TradeTab;
  initialBuyAddress?: string;
  initialSellAddress?: string;
}) {
  const navigate = useNavigate({ from: "/app/swap/" });

  function handleTabChange(next: string) {
    void navigate({ search: (prev) => ({ ...prev, tab: next as TradeTab }), replace: true });
  }

  const tabsSlot = (
    <TabsList className="flex h-auto items-center gap-1 rounded-full bg-secondary/60 p-1">
      <TabsTrigger value="swap" className={PILL}>
        Swap
      </TabsTrigger>
      <TabsTrigger value="bridge" className={PILL}>
        Bridge
        <Badge variant="secondary" className="ml-1.5 rounded-full px-1.5 py-0 text-[10px]">
          New
        </Badge>
      </TabsTrigger>
    </TabsList>
  );

  return (
    <Tabs value={initialTab} onValueChange={handleTabChange}>
      <TabsContent value="swap" className="mt-0">
        <SwapPage
          tabsSlot={tabsSlot}
          initialBuyAddress={initialBuyAddress}
          initialSellAddress={initialSellAddress}
        />
      </TabsContent>
      <TabsContent value="bridge" className="mt-0">
        <BridgePage tabsSlot={tabsSlot} />
      </TabsContent>
    </Tabs>
  );
}
