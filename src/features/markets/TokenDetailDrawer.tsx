import { ArrowUpRight } from "lucide-react";
import { CopyContractButton } from "@/components/feed/CopyContractButton";
import { WatchButton } from "@/components/common/WatchButton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExternalBuyButton } from "./ExternalBuyButton";
import {
  changeClass,
  formatCompactUsd,
  formatNumber,
  formatPairAge,
  formatPercent,
} from "@/lib/market/format";
import type { RobinhoodHotSearchToken, RobinhoodTrendingToken } from "@/types/gmgn";

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${className ?? ""}`}>{value}</p>
    </div>
  );
}

export function TokenDetailDrawer({
  token,
  open,
  onOpenChange,
}: {
  token: RobinhoodTrendingToken | RobinhoodHotSearchToken | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!token) return null;
  const priceChange =
    token.priceChange1h ??
    token.priceChange24h ??
    token.priceChange6h ??
    token.priceChange5m ??
    token.priceChange1m;
  const volume =
    token.volume1hUsd ??
    token.volume24hUsd ??
    token.volume6hUsd ??
    token.volume5mUsd ??
    token.volume1mUsd;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            {token.logoUrl ? (
              <img
                src={token.logoUrl}
                alt=""
                width={40}
                height={40}
                className="size-10 rounded-full border border-border"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold">
                {token.symbol.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <SheetTitle>{token.name}</SheetTitle>
              <SheetDescription>{token.symbol} · Robinhood Mainnet</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Contract</p>
              <p className="font-mono text-xs">{token.address}</p>
            </div>
            <CopyContractButton address={token.address} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Stat label="Price" value={formatCompactUsd(token.priceUsd)} />
            <Stat
              label="Price change"
              value={formatPercent(priceChange)}
              className={changeClass(priceChange)}
            />
            <Stat label="Market cap" value={formatCompactUsd(token.marketCapUsd)} />
            <Stat label="ATH market cap" value={formatCompactUsd(token.athMarketCapUsd)} />
            <Stat label="Liquidity" value={formatCompactUsd(token.liquidityUsd)} />
            <Stat label="Volume" value={formatCompactUsd(volume)} />
            <Stat label="Holders" value={formatNumber(token.holders)} />
            <Stat label="Age" value={formatPairAge(token.ageSeconds)} />
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Security</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {token.security?.honeypot ? (
                <span className="rounded-full bg-negative/10 px-2 py-0.5 text-negative">
                  Honeypot flagged
                </span>
              ) : null}
              {token.security?.renounced ? (
                <span className="rounded-full bg-positive/10 px-2 py-0.5 text-positive">
                  Mint/freeze renounced
                </span>
              ) : null}
              {token.security?.topHolderPercent !== undefined ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  Top 10 holders: {token.security.topHolderPercent.toFixed(1)}%
                </span>
              ) : null}
              {!token.security ? (
                <span className="text-muted-foreground">Not reported by GMGN.</span>
              ) : null}
            </div>
          </div>

          {token.externalLinks ? (
            <div className="flex flex-wrap gap-3 text-xs">
              {Object.entries(token.externalLinks).map(([key, url]) =>
                url ? (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand hover:underline"
                  >
                    {key} <ArrowUpRight className="size-3" />
                  </a>
                ) : null,
              )}
            </div>
          ) : null}

          <div className="flex items-center gap-2 pt-2">
            <ExternalBuyButton token={token} size="default" />
            <WatchButton
              entry={{
                kind: "dex",
                id: token.pairAddress ?? token.address,
                chainId: "robinhood",
                address: token.address,
                symbol: token.symbol,
                name: token.name,
              }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
