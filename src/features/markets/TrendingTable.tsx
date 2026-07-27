import { RobinhoodTokenTable } from "./RobinhoodTokenTable";
import type { GmgnInterval, RobinhoodTrendingToken } from "@/types/gmgn";

export function TrendingTable({
  tokens,
  interval,
  onOpenToken,
}: {
  tokens: RobinhoodTrendingToken[];
  interval: GmgnInterval;
  onOpenToken: (token: RobinhoodTrendingToken) => void;
}) {
  return (
    <RobinhoodTokenTable
      tokens={tokens}
      interval={interval}
      variant="trending"
      emptyLabel="No Robinhood Mainnet tokens were returned for this interval."
      onOpenToken={onOpenToken}
    />
  );
}
