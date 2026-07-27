import { RobinhoodTokenTable } from "./RobinhoodTokenTable";
import type { GmgnInterval, RobinhoodHotSearchToken, RobinhoodTrendingToken } from "@/types/gmgn";

export function HotSearchesTable({
  tokens,
  interval,
  onOpenToken,
}: {
  tokens: RobinhoodHotSearchToken[];
  interval: GmgnInterval;
  onOpenToken: (token: RobinhoodTrendingToken) => void;
}) {
  return (
    <RobinhoodTokenTable
      tokens={tokens}
      interval={interval}
      variant="hot-searches"
      emptyLabel="No Robinhood Mainnet tokens were returned for this interval."
      onOpenToken={onOpenToken}
    />
  );
}
