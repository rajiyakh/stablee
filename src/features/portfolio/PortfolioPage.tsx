import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { BuySwapButton } from "@/components/market/BuySwapButton";
import { robinhoodChain } from "@/config/robinhoodChain";
import { formatNumber, formatUsd } from "@/lib/market/format";
import { ApiError } from "@/lib/market/client";
import { portfolioHoldingsQuery, type PortfolioHolding } from "@/lib/portfolio/client";
import { CopyContractButton } from "@/components/feed/CopyContractButton";

export function PortfolioPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <EmptyState
        icon={<Wallet className="size-8" />}
        title="Connect a wallet to see your portfolio"
        description="Once connected, every token your wallet holds on Robinhood Mainnet shows up here, priced live."
        action={<WalletConnectButton />}
      />
    );
  }

  return <ConnectedPortfolio address={address} />;
}

function ConnectedPortfolio({ address }: { address: string }) {
  const query = useQuery(portfolioHoldingsQuery(address, true));

  if (query.isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="card-surface p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-9 w-40" />
        </div>
        <div className="card-surface divide-y divide-border/60 p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Reading every token this wallet holds on-chain — can take a few seconds for older wallets.
        </p>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <p className="rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative">
          {query.error instanceof ApiError
            ? query.error.message
            : "Robinhood Mainnet holdings are temporarily unavailable."}
        </p>
      </div>
    );
  }

  const data = query.data?.data;
  if (!data) return null;

  if (data.holdings.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <EmptyState
          title="No tokens found"
          description="This wallet doesn't hold any tokens on Robinhood Mainnet yet."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="card-surface flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Portfolio value
          </p>
          <p className="font-display mt-1 text-3xl font-semibold text-foreground tabular-nums">
            {formatUsd(data.totalUsd)}
          </p>
        </div>
        <CopyContractButton address={address} className="h-8" />
      </div>

      <div className="card-surface divide-y divide-border/60 p-2">
        {data.holdings.map((holding) => (
          <HoldingRow key={holding.address} holding={holding} />
        ))}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Holdings and prices from{" "}
        {robinhoodChain?.blockExplorers?.default.url ? (
          <a
            href={robinhoodChain.blockExplorers.default.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Robinhood Chain Blockscout
          </a>
        ) : (
          "Robinhood Chain Blockscout"
        )}
        .
      </p>
    </div>
  );
}

function HoldingRow({ holding }: { holding: PortfolioHolding }) {
  const [imgError, setImgError] = useState(false);
  const showIcon = holding.logoUrl && !imgError;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary/40">
      {showIcon ? (
        <img
          src={holding.logoUrl!}
          alt=""
          className="size-8 shrink-0 rounded-full bg-muted object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
          {holding.symbol.slice(0, 1).toUpperCase()}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-foreground">{holding.symbol}</span>
          {holding.flagged ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-warning"
              title="This token's data looks unusual (unreviewed contract or suspicious name/symbol) — anyone can airdrop a token to your wallet, trade or interact with it at your own risk"
            >
              <AlertTriangle className="size-3" />
              Flagged
            </span>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">{holding.name}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-medium tabular-nums text-foreground">
          {formatNumber(Number(holding.balanceFormatted), true)} {holding.symbol}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">{formatUsd(holding.valueUsd)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <BuySwapButton chainId="robinhood" address={holding.address} size="sm" />
        <Button asChild variant="outline" size="sm">
          <Link to="/swap" search={{ sell: holding.address }}>
            Sell
          </Link>
        </Button>
      </div>
    </div>
  );
}
