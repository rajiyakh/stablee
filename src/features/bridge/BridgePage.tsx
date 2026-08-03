import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useSwitchChain } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { formatUnits } from "viem";
import { ArrowDownUp, ChevronDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { robinhoodChainFacts } from "@/config/robinhoodChain";
import {
  bridgeChainsQuery,
  bridgeProvidersQuery,
  bridgeQuoteQuery,
  bridgeTokensQuery,
} from "@/lib/bridge/client";
import { trackBridgeEvent } from "@/lib/bridge/analytics";
import { ApiError } from "@/lib/market/client";
import type {
  BridgeSortMode,
  NormalizedBridgeQuote,
  SupportedChain,
  SupportedToken,
} from "@/lib/bridge/types";
import type { ValidatedBridgeQuote } from "@/lib/bridge/validateBridgeQuote";

import { SwapAmountInput } from "@/features/swap/SwapAmountInput";
import { SlippageControl } from "@/features/swap/SlippageControl";
import { BridgeChainSelect } from "./BridgeChainSelect";
import { BridgeTokenSelect } from "./BridgeTokenSelect";
import { BridgeQuoteSummary } from "./BridgeQuoteSummary";
import { RecipientAddressInput } from "./RecipientAddressInput";
import { BridgeRouteCard } from "./BridgeRouteCard";
import { BridgeRouteSteps } from "./BridgeRouteDetailsDialog";
import { BridgeConfirmDialog } from "./BridgeConfirmDialog";
import { BridgeStatusPanel } from "./BridgeStatusPanel";
import { BridgeRiskNotice } from "./BridgeRiskNotice";
import { BridgeNotConfiguredNotice } from "./BridgeNotConfiguredNotice";
import { useBridgeTokenBalance } from "./hooks/useBridgeTokenBalance";
import { useBridgeApproval } from "./hooks/useBridgeApproval";
import { useBridgeExecution } from "./hooks/useBridgeExecution";
import { useBridgeStatus } from "./hooks/useBridgeStatus";

const SORT_TABS: Array<{ value: BridgeSortMode; label: string }> = [
  { value: "bestReturn", label: "Best Return" },
  { value: "fastest", label: "Fastest" },
  { value: "lowestCost", label: "Lowest Cost" },
];

type Flow = "idle" | "needs-approval" | "approving" | "ready" | "submitted";

function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BridgePage({ tabsSlot }: { tabsSlot?: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { connectWallet } = usePrivy();

  const providersQuery = useQuery(bridgeProvidersQuery());
  const providersData = providersQuery.data?.data;
  const bridgingConfigured =
    Boolean(providersData?.treasuryConfigured) &&
    Boolean(providersData?.providers.some((p) => p.configured && p.feeMode === "provider-native"));

  const chainsQuery = useQuery(bridgeChainsQuery(bridgingConfigured));
  const chains = useMemo(() => chainsQuery.data?.data ?? [], [chainsQuery.data]);

  const [fromChain, setFromChain] = useState<SupportedChain | null>(null);
  const [toChain, setToChain] = useState<SupportedChain | null>(null);

  useEffect(() => {
    if (chains.length === 0 || fromChain) return;
    const robinhoodChainId = robinhoodChainFacts?.id;
    const connected = chains.find((c) => c.chainId === chainId);
    setFromChain(connected ?? chains.find((c) => c.chainId !== robinhoodChainId) ?? chains[0]);
    const robinhood = robinhoodChainId
      ? chains.find((c) => c.chainId === robinhoodChainId)
      : undefined;
    setToChain(robinhood ?? chains[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chains]);

  const fromTokensQuery = useQuery(
    bridgeTokensQuery(fromChain?.chainId ?? null, bridgingConfigured),
  );
  const toTokensQuery = useQuery(bridgeTokensQuery(toChain?.chainId ?? null, bridgingConfigured));
  const fromTokens = fromTokensQuery.data?.data ?? [];
  const toTokens = toTokensQuery.data?.data ?? [];

  const [fromToken, setFromToken] = useState<SupportedToken | null>(null);
  const [toToken, setToToken] = useState<SupportedToken | null>(null);

  useEffect(() => {
    if (fromTokens.length > 0 && !fromToken) setFromToken(fromTokens[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromTokensQuery.data, fromToken]);
  useEffect(() => {
    if (toTokens.length > 0 && !toToken) setToToken(toTokens[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toTokensQuery.data, toToken]);

  const [amountInput, setAmountInput] = useState("");
  const [recipient, setRecipient] = useState("");
  const [recipientAcknowledged, setRecipientAcknowledged] = useState(false);
  const [slippageBps, setSlippageBps] = useState<number | null>(null);
  const [sort, setSort] = useState<BridgeSortMode>("bestReturn");
  const [flow, setFlow] = useState<Flow>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<NormalizedBridgeQuote | null>(null);

  useEffect(() => {
    if (address && !recipient) setRecipient(address);
  }, [address, recipient]);

  const balance = useBridgeTokenBalance(fromToken, fromChain?.chainId ?? null);

  const amountBaseUnits = useMemo(() => {
    if (!fromToken || !amountInput || Number(amountInput) <= 0) return "";
    try {
      const [whole, frac = ""] = amountInput.split(".");
      const paddedFrac = frac.slice(0, fromToken.decimals).padEnd(fromToken.decimals, "0");
      return `${whole}${paddedFrac}`.replace(/^0+(?=\d)/, "");
    } catch {
      return "";
    }
  }, [fromToken, amountInput]);

  const insufficientBalance =
    isConnected &&
    balance.balance !== null &&
    amountBaseUnits !== "" &&
    BigInt(amountBaseUnits) > balance.balance;

  const wrongNetwork = isConnected && fromChain && chainId !== fromChain.chainId;

  const quoteParams = {
    fromChainId: fromChain?.chainId ?? 0,
    toChainId: toChain?.chainId ?? 0,
    fromToken: fromToken?.address ?? "",
    toToken: toToken?.address ?? "",
    fromAmount: amountBaseUnits,
    sender: address ?? "",
    recipient: recipient || address || "",
    slippageBps: slippageBps ?? undefined,
    sort,
  };

  const quoteQuery = useQuery(
    bridgeQuoteQuery(
      quoteParams,
      bridgingConfigured &&
        Boolean(
          fromChain && toChain && fromToken && toToken && amountBaseUnits && address && recipient,
        ),
    ),
  );

  useEffect(() => {
    if (quoteQuery.isFetching) trackBridgeEvent("quote_requested", { provider: undefined });
  }, [quoteQuery.isFetching]);

  const routes = quoteQuery.data?.data?.routes ?? [];
  const excluded = quoteQuery.data?.data?.excluded ?? [];
  const feeBps = quoteQuery.data?.data?.feeBps ?? 100;

  // The route the summary/CTA/details disclosure reflect: whichever route the
  // user explicitly picked, as long as it's still present in the latest quote
  // results, else the top-ranked route for the active sort.
  const activeQuote =
    selectedQuote && routes.some((r) => r.routeId === selectedQuote.routeId)
      ? selectedQuote
      : (routes[0] ?? null);
  const providerDisplayName =
    providersData?.providers.find((p) => p.id === activeQuote?.provider)?.displayName ??
    activeQuote?.provider ??
    null;

  const validatedQuote = selectedQuote as ValidatedBridgeQuote | null;
  const approval = useBridgeApproval(
    flow === "needs-approval" || flow === "approving" ? validatedQuote : null,
  );
  const execution = useBridgeExecution();
  const isCustomRecipient = Boolean(address) && recipient.toLowerCase() !== address?.toLowerCase();

  const statusTracking = useBridgeStatus(
    selectedQuote?.provider ?? null,
    selectedQuote?.routeId ?? null,
    execution.hash ?? null,
    fromChain?.chainId ?? null,
    toChain?.chainId ?? null,
  );

  useEffect(() => {
    if (approval.isConfirmed) {
      setFlow("ready");
      setConfirmOpen(true);
    }
  }, [approval.isConfirmed]);

  function selectRoute(route: NormalizedBridgeQuote) {
    setSelectedQuote(route);
    trackBridgeEvent("route_selected", { provider: route.provider });
    if (route.approvalTarget) {
      setFlow("needs-approval");
    } else {
      setFlow("ready");
      setConfirmOpen(true);
    }
  }

  function handleApproveClick() {
    if (wrongNetwork) {
      toast.error(
        `Wrong network. Switch to ${fromChain?.name ?? "the source chain"} before approving.`,
      );
      return;
    }
    setFlow("approving");
    trackBridgeEvent("approval_submitted", { provider: selectedQuote?.provider });
    approval.approveExact();
  }

  function handleConfirmBridge() {
    if (!validatedQuote) return;
    if (wrongNetwork) {
      toast.error(
        `Wrong network. Switch to ${fromChain?.name ?? "the source chain"} before confirming.`,
      );
      return;
    }
    if (Date.now() > validatedQuote.meta.expiresAt) {
      toast.error("This quote has expired. Request a new quote before confirming.");
      return;
    }
    trackBridgeEvent("bridge_submitted", { provider: validatedQuote.provider });
    execution.executeBridge(validatedQuote);
  }

  function handlePrimaryCta() {
    if (!isConnected) {
      connectWallet();
      return;
    }
    if (wrongNetwork && fromChain) {
      switchChain({ chainId: fromChain.chainId });
      return;
    }
    if (!activeQuote) return;
    if (flow === "needs-approval") {
      handleApproveClick();
      return;
    }
    if (flow === "ready" && selectedQuote?.routeId === activeQuote.routeId) {
      setConfirmOpen(true);
      return;
    }
    selectRoute(activeQuote);
  }

  useEffect(() => {
    if (!execution.isConfirmed) return;
    setConfirmOpen(false);
    setFlow("submitted");
  }, [execution.isConfirmed]);

  useEffect(() => {
    if (statusTracking.status?.state === "completed") {
      trackBridgeEvent("bridge_completed", { provider: selectedQuote?.provider });
    } else if (statusTracking.status?.state === "failed") {
      trackBridgeEvent("bridge_failed", { provider: selectedQuote?.provider });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTracking.status?.state]);

  if (providersQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="card-surface space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">{tabsSlot}</div>
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!bridgingConfigured) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="card-surface space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">{tabsSlot}</div>
          <BridgeNotConfiguredNotice message="Bridge provider credentials and the RobinPulse treasury address haven't been configured for this deployment yet." />
        </div>
      </div>
    );
  }

  const fromUsd =
    fromToken?.priceUsd != null && Number(amountInput) > 0
      ? formatUsd(Number(amountInput) * fromToken.priceUsd)
      : null;
  const toOutputAmount = activeQuote
    ? Number(formatUnits(BigInt(activeQuote.estimatedOutputAmount || "0"), toToken?.decimals ?? 18))
    : null;
  const toUsd =
    toToken?.priceUsd != null && toOutputAmount !== null && toOutputAmount > 0
      ? formatUsd(toOutputAmount * toToken.priceUsd)
      : null;

  let ctaLabel: string;
  if (!isConnected) {
    ctaLabel = "Connect Wallet";
  } else if (wrongNetwork) {
    ctaLabel = `Switch to ${fromChain?.name ?? "source chain"}`;
  } else if (insufficientBalance) {
    ctaLabel = "Insufficient balance";
  } else if (!activeQuote) {
    ctaLabel = quoteQuery.isFetching ? "Fetching routes…" : "Enter an amount";
  } else if (flow === "needs-approval") {
    ctaLabel =
      approval.isApproving || approval.isConfirming ? "Approving…" : `Approve ${fromToken?.symbol}`;
  } else {
    ctaLabel = "Review Bridge";
  }
  const ctaDisabled =
    (isConnected && !wrongNetwork && (insufficientBalance || !activeQuote)) ||
    (flow === "needs-approval" && (approval.isApproving || approval.isConfirming)) ||
    (wrongNetwork ? isSwitching : false);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card-surface space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {tabsSlot}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => void quoteQuery.refetch()}
              aria-label="Refresh quote"
              disabled={quoteQuery.isFetching}
            >
              <RefreshCw className={quoteQuery.isFetching ? "size-3.5 animate-spin" : "size-3.5"} />
            </Button>
            <SlippageControl slippageBps={slippageBps} onChange={setSlippageBps} />
          </div>
        </div>

        <div className="space-y-4">
          {wrongNetwork ? (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              <p>Wrong network. Switch to {fromChain?.name} to bridge from this chain.</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                disabled={isSwitching}
                onClick={() => fromChain && switchChain({ chainId: fromChain.chainId })}
              >
                Switch to {fromChain?.name}
              </Button>
            </div>
          ) : null}

          <BridgeRiskNotice fromChain={fromChain} toChain={toChain} />

          <div className="space-y-1">
            <SwapAmountInput
              label={
                <span className="flex items-center gap-1">
                  From
                  <span className="opacity-40">·</span>
                  <BridgeChainSelect
                    variant="minimal"
                    chains={chains}
                    value={fromChain}
                    onChange={setFromChain}
                    label="From network"
                    loading={chainsQuery.isLoading}
                  />
                </span>
              }
              token={fromToken}
              value={amountInput}
              onChange={setAmountInput}
              balanceFormatted={balance.formatted}
              balanceLoading={isConnected && balance.isLoading}
              balanceError={isConnected && balance.isError}
              onRetryBalance={balance.refetch}
              tokenSelect={
                <BridgeTokenSelect
                  tokens={fromTokens}
                  value={fromToken}
                  onChange={setFromToken}
                  label="From token"
                  loading={fromTokensQuery.isLoading}
                />
              }
              footer={
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">{fromUsd ?? ""}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 shrink-0 px-2 text-[11px]"
                    disabled={balance.balance === null}
                    onClick={() => {
                      if (!fromToken || balance.balance === null) return;
                      setAmountInput(
                        (Number(balance.balance) / 10 ** fromToken.decimals).toString(),
                      );
                    }}
                  >
                    Max
                  </Button>
                </div>
              }
            />

            <div className="relative z-10 -my-5 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 rounded-full border-4 border-background bg-card shadow-sm"
                aria-label="Reverse chains"
                onClick={() => {
                  const f = fromChain;
                  setFromChain(toChain);
                  setToChain(f);
                  const ft = fromToken;
                  setFromToken(toToken);
                  setToToken(ft);
                }}
              >
                <ArrowDownUp className="size-3.5" />
              </Button>
            </div>

            <SwapAmountInput
              label={
                <span className="flex items-center gap-1">
                  To
                  <span className="opacity-40">·</span>
                  <BridgeChainSelect
                    variant="minimal"
                    chains={chains}
                    value={toChain}
                    onChange={setToChain}
                    label="To network"
                    loading={chainsQuery.isLoading}
                  />
                </span>
              }
              token={toToken}
              value={
                toOutputAmount !== null
                  ? toOutputAmount.toLocaleString("en-US", { maximumFractionDigits: 6 })
                  : ""
              }
              readOnly
              tokenSelect={
                <BridgeTokenSelect
                  tokens={toTokens}
                  value={toToken}
                  onChange={setToToken}
                  label="To token"
                  loading={toTokensQuery.isLoading}
                />
              }
              footer={
                toUsd ? (
                  <div className="mt-2 text-xs text-muted-foreground">{toUsd}</div>
                ) : undefined
              }
            />
          </div>

          <RecipientAddressInput
            value={recipient}
            connectedAddress={address}
            onChange={setRecipient}
            acknowledged={recipientAcknowledged}
            onAcknowledgeChange={setRecipientAcknowledged}
          />

          {insufficientBalance ? (
            <p className="rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative">
              Insufficient {fromToken?.symbol} balance.
            </p>
          ) : null}

          {quoteQuery.isError ? (
            <p className="rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative">
              {quoteQuery.error instanceof ApiError
                ? quoteQuery.error.message
                : "Bridge routes are temporarily unavailable."}
            </p>
          ) : null}

          {activeQuote ? (
            <BridgeQuoteSummary
              quote={activeQuote}
              onRefresh={() => void quoteQuery.refetch()}
              refreshing={quoteQuery.isFetching}
            />
          ) : quoteQuery.isFetching ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Fetching routes…</p>
          ) : null}

          {activeQuote ? (
            <details className="group rounded-full border border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-1.5 text-xs text-muted-foreground">
                Route details
                <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-border p-3">
                <BridgeRouteSteps quote={activeQuote} />
              </div>
            </details>
          ) : null}

          {routes.length > 0 || excluded.length > 0 ? (
            <details className="text-sm">
              <summary className="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground">
                Compare all routes
              </summary>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-1 rounded-full bg-secondary/60 p-1 text-xs">
                  {SORT_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setSort(tab.value)}
                      className={
                        sort === tab.value
                          ? "flex-1 rounded-full bg-card px-2 py-1 font-semibold text-foreground shadow-sm"
                          : "flex-1 rounded-full px-2 py-1 text-muted-foreground"
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {routes.map((route, index) => (
                  <BridgeRouteCard
                    key={`${route.provider}-${route.routeId}`}
                    quote={route}
                    highlight={
                      index === 0 ? SORT_TABS.find((t) => t.value === sort)?.label : undefined
                    }
                    selected={activeQuote?.routeId === route.routeId}
                    onSelect={() => selectRoute(route)}
                  />
                ))}

                {excluded.length > 0 ? (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">
                      {excluded.length} provider{excluded.length === 1 ? "" : "s"} unavailable for
                      this route
                    </summary>
                    <ul className="mt-1 space-y-0.5">
                      {excluded.map((e) => (
                        <li key={e.provider}>
                          {e.provider}: {e.reason}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            </details>
          ) : null}

          <Button className="w-full" onClick={handlePrimaryCta} disabled={ctaDisabled}>
            {ctaLabel}
          </Button>

          {providerDisplayName && flow !== "submitted" ? (
            <p className="text-center text-xs text-muted-foreground">
              routing by {providerDisplayName}
            </p>
          ) : null}

          {statusTracking.status ? <BridgeStatusPanel status={statusTracking.status} /> : null}
        </div>
      </div>

      {selectedQuote ? (
        <BridgeConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          quote={selectedQuote}
          feeBps={feeBps}
          isCustomRecipient={isCustomRecipient}
          onConfirm={handleConfirmBridge}
          isSubmitting={execution.isSubmitting || execution.isConfirming}
        />
      ) : null}
    </div>
  );
}
