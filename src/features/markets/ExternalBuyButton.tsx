import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { resolveTradingDestination } from "@/config/tradingDestinations";
import { ExternalTradeConfirmation } from "./ExternalTradeConfirmation";
import type { RobinhoodTrendingToken } from "@/types/gmgn";

/**
 * Never executes a transaction and never requests wallet permissions on
 * click — this only opens a confirmation dialog that links out to a
 * whitelisted external destination.
 */
export function ExternalBuyButton({
  token,
  size = "sm",
}: {
  token: RobinhoodTrendingToken;
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const resolved = useMemo(
    () =>
      resolveTradingDestination({
        address: token.address,
        chain: "robinhood",
        pairAddress: token.pairAddress,
      }),
    [token.address, token.pairAddress],
  );

  if (!resolved) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button size={size} variant="outline" disabled className="cursor-not-allowed">
              Buy
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          No verified trading route is currently available for this token.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <>
      <Button
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        Buy
      </Button>
      <ExternalTradeConfirmation
        open={open}
        onOpenChange={setOpen}
        token={token}
        destination={resolved.destination}
        url={resolved.url}
      />
    </>
  );
}
