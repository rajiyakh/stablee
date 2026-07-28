import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { projectConfig } from "@/config/project";

/**
 * The only Buy CTA in the app — always navigates to the internal /swap page
 * with the token pre-selected as the buy side, never to an external DEX.
 * Renders nothing for a token this app can't actually swap (anything not on
 * Robinhood Chain) rather than linking to a broken/empty swap state.
 */
export function BuySwapButton({
  chainId,
  address,
  size = "sm",
  className,
}: {
  chainId: string;
  address: string;
  size?: "sm" | "default";
  className?: string;
}) {
  if (chainId.toLowerCase() !== projectConfig.dataSources.robinhoodDexScreenerChainId) {
    return null;
  }

  return (
    <Button asChild size={size} className={className} onClick={(e) => e.stopPropagation()}>
      <Link to="/swap" search={{ buy: address }}>
        Buy
      </Link>
    </Button>
  );
}
