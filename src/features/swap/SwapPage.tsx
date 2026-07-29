import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { ArrowDownUp, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { robinhoodChain } from "@/config/robinhoodChain";
import { WALLET_NOT_CONFIGURED_MESSAGE } from "@/config/project";
import {
  swapTokens,
  WETH_ADDRESS,
  USDG_ADDRESS,
  findSwapToken,
  type SwapTokenConfig,
} from "@/config/swapTokens";
import { PRICE_IMPACT_MAX_BPS, QUOTE_TTL_MS } from "@/config/swapPolicy";
import {
  resolveTokenQuery,
  swapPriceQuery,
  swapQuoteQuery,
  swapTokensQuery,
  type SwapQuoteData,
} from "@/lib/swap/client";
import { trackSwapEvent } from "@/lib/swap/analytics";
import { ApiError } from "@/lib/market/client";
import { TokenSelect } from "./TokenSelect";
import { SwapAmountInput } from "./SwapAmountInput";
import { SwapPercentageButtons } from "./SwapPercentageButtons";
import { SwapQuoteDetails } from "./SwapQuoteDetails";
import { SwapConfirmDialog } from "./SwapConfirmDialog";
import { SlippageControl } from "./SlippageControl";
import { useSwapTokenBalance } from "./hooks/useSwapTokenBalance";
import { useTokenApproval } from "./hooks/useTokenApproval";
import { useSwapExecution } from "./hooks/useSwapExecution";

type FlowState = "idle" | "needs-approval" | "approving" | "ready" | "success";

export function SwapPage({
  initialBuyAddress,
  initialSellAddress,
}: {
  /** Deep-links a token in as the buy/sell side — see BuySwapButton, the only producer of these. */
  initialBuyAddress?: string;
  initialSellAddress?: string;
}) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [sellToken, setSellToken] = useState<SwapTokenConfig | null>(
    findSwapToken(WETH_ADDRESS) ?? swapTokens[0],
  );
  const [buyToken, setBuyToken] = useState<SwapTokenConfig | null>(
    findSwapToken(USDG_ADDRESS) ?? swapTokens[1],
  );

  // Resolves via the same curated -> GMGN -> on-chain lookup TokenSelect's
  // paste-address flow uses (resolveSwapToken() server-side) — never trusts
  // the caller's claimed symbol/decimals, only the address itself.
  const resolvedBuyQuery = useQuery(
    resolveTokenQuery(initialBuyAddress ?? "", Boolean(initialBuyAddress)),
  );
  const resolvedSellQuery = useQuery(
    resolveTokenQuery(initialSellAddress ?? "", Boolean(initialSellAddress)),
  );

  useEffect(() => {
    const resolved = resolvedBuyQuery.data?.data;
    if (!resolved) return;
    setBuyToken(resolved);
    // Never leave both sides on the same token — if no explicit sell address
    // was requested and the buy token happens to match the current sell
    // default, fall back sell to the other default instead.
    if (!initialSellAddress) {
      setSellToken((prevSell) => {
        if (!prevSell || prevSell.address.toLowerCase() !== resolved.address.toLowerCase()) {
          return prevSell;
        }
        const fallback =
          resolved.address.toLowerCase() === WETH_ADDRESS.toLowerCase()
            ? findSwapToken(USDG_ADDRESS)
            : findSwapToken(WETH_ADDRESS);
        return fallback ?? prevSell;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedBuyQuery.data]);

  useEffect(() => {
    const resolved = resolvedSellQuery.data?.data;
    if (!resolved) return;
    setSellToken(resolved);
  }, [resolvedSellQuery.data]);
  const [sellAmountInput, setSellAmountInput] = useState("");
  // null means Auto — 0x selects an appropriate tolerance for the pair.
  const [slippageBps, setSlippageBps] = useState<number | null>(null);
  const [flow, setFlow] = useState<FlowState>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [firmQuote, setFirmQuote] = useState<{ data: SwapQuoteData; fetchedAt: number } | null>(
    null,
  );

  const wrongNetwork = isConnected && robinhoodChain && chainId !== robinhoodChain.id;
  const balance = useSwapTokenBalance(sellToken);

  // The branded ValidatedQuote only exists when the server's validateQuote()
  // returned ok:true — this is a type-safe narrowing, not a cast. Neither
  // useTokenApproval nor useSwapExecution can be called with an unvalidated
  // response because this is the only way to obtain a ValidatedQuote value.
  const validatedFirmQuote = firmQuote?.data.validation.ok ? firmQuote.data.validation.quote : null;

  const approval = useTokenApproval(validatedFirmQuote);
  const execution = useSwapExecution();

  const sellAmountBaseUnits = useMemo(() => {
    if (!sellToken || !sellAmountInput || Number(sellAmountInput) <= 0) return "";
    try {
      return parseUnits(sellAmountInput, sellToken.decimals).toString();
    } catch {
      return "";
    }
  }, [sellToken, sellAmountInput]);

  // Pure client-side check against the already-fetched wallet balance — no
  // need to wait for a quote round trip to tell the user they've typed more
  // than they hold.
  const insufficientBalance =
    isConnected &&
    balance.balance !== null &&
    sellAmountBaseUnits !== "" &&
    BigInt(sellAmountBaseUnits) > balance.balance;

  const priceParams = {
    sellToken: sellToken?.address ?? "",
    buyToken: buyToken?.address ?? "",
    sellAmount: sellAmountBaseUnits || undefined,
    taker: address,
    // undefined (not null) omits the param entirely — 0x then selects an
    // appropriate slippage tolerance for the pair automatically.
    slippageBps: slippageBps ?? undefined,
  };
  const priceQuery = useQuery(
    swapPriceQuery(
      priceParams,
      Boolean(sellToken && buyToken && sellAmountBaseUnits && !wrongNetwork),
    ),
  );

  const quoteQuery = useQuery(swapQuoteQuery({ ...priceParams, taker: address ?? "" }, false));

  // Curated tokens, broadened with GMGN-discovered + on-chain-decimals-confirmed
  // tokens where available. Falls back to the static curated list only.
  const tokensQuery = useQuery(swapTokensQuery());
  // Session-only: tokens the user resolved by pasting a contract address in
  // TokenSelect. Never persisted — the server independently re-resolves any
  // address via the same on-chain lookup, so nothing here is trusted as-is.
  const [customTokens, setCustomTokens] = useState<SwapTokenConfig[]>([]);
  const baseTokens = tokensQuery.data?.data ?? swapTokens;
  const availableTokens = useMemo(() => {
    const known = new Set(baseTokens.map((t) => t.address.toLowerCase()));
    return [...baseTokens, ...customTokens.filter((t) => !known.has(t.address.toLowerCase()))];
  }, [baseTokens, customTokens]);

  function rememberCustomToken(token: SwapTokenConfig) {
    setCustomTokens((prev) =>
      prev.some((t) => t.address.toLowerCase() === token.address.toLowerCase())
        ? prev
        : [...prev, token],
    );
  }

  useEffect(() => {
    setFlow("idle");
    setFirmQuote(null);
  }, [sellToken?.address, buyToken?.address, sellAmountInput, slippageBps]);

  useEffect(() => {
    if (approval.isConfirmed) {
      // Spec requirement: the original quote may be stale by the time approval
      // confirms — always re-fetch before showing the review modal.
      void requestFirmQuote();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approval.isConfirmed]);

  // Keeps the confirm dialog's firm quote from ever sitting expired while
  // open — schedules exactly one re-fetch for when the current firmQuote
  // will hit QUOTE_TTL_MS. requestFirmQuote() sets a new firmQuote with a
  // fresh fetchedAt, which re-triggers this effect for the next cycle —
  // same self-sustaining pattern as the approval.isConfirmed effect above,
  // just timer-driven instead of event-driven.
  useEffect(() => {
    if (!firmQuote || !confirmOpen || execution.isSwapping || execution.isConfirming) return;
    const msUntilExpiry = QUOTE_TTL_MS - (Date.now() - firmQuote.fetchedAt);
    if (msUntilExpiry <= 0) {
      void requestFirmQuote();
      return;
    }
    const id = window.setTimeout(() => void requestFirmQuote(), msUntilExpiry);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmQuote, confirmOpen, execution.isSwapping, execution.isConfirming]);

  async function requestFirmQuote() {
    if (!address || !sellToken || !buyToken) return;
    trackSwapEvent("quote_requested", { sellToken: sellToken.address, buyToken: buyToken.address });

    const result = await quoteQuery.refetch();
    if (result.error) {
      const message =
        result.error instanceof ApiError
          ? result.error.message
          : "Robinhood Mainnet market data is temporarily unavailable.";
      trackSwapEvent("quote_failed", {
        sellToken: sellToken.address,
        buyToken: buyToken.address,
        errorCode: result.error instanceof ApiError ? result.error.code : "unknown",
      });
      toast.error(message);
      setFlow("idle");
      return;
    }
    const data = result.data?.data;
    if (!data) return;

    const fetchedAt = Date.now();
    setFirmQuote({ data, fetchedAt });

    if (!data.liquidityAvailable) {
      trackSwapEvent("quote_failed", {
        sellToken: sellToken.address,
        buyToken: buyToken.address,
        errorCode: "no_liquidity",
      });
      toast.error("No liquidity is available for this pair.");
      setFlow("idle");
      return;
    }
    if (!data.validation.ok) {
      trackSwapEvent("quote_failed", {
        sellToken: sellToken.address,
        buyToken: buyToken.address,
        errorCode: data.validation.issues[0]?.code ?? "invalid",
      });
      // price_impact_severe is pre-empted server-side (see /api/swap/quote's
      // customError branch) and surfaces via the result.error path above,
      // not here — this only covers the remaining issue codes (fee_missing,
      // token_mismatch, missing_transaction, balance_issue,
      // simulation_incomplete, quote_expired), none of which should be
      // shown silently.
      toast.error("This quote could not be validated. Please try again.");
      setFlow("idle");
      return;
    }

    trackSwapEvent("quote_successful", {
      sellToken: sellToken.address,
      buyToken: buyToken.address,
      feeToken: data.fees?.integratorFee?.token,
      feeAmount: data.fees?.integratorFee?.amount,
      feeUsd: data.feeUsd ?? undefined,
    });

    if (data.issues?.allowance?.spender) {
      setFlow("needs-approval");
    } else {
      setFlow("ready");
      setConfirmOpen(true);
    }
  }

  function handlePercentageSelect(percentage: number) {
    if (!sellToken || balance.maxSellValue === null) return;
    const amount = (balance.maxSellValue * BigInt(percentage)) / 100n;
    setSellAmountInput(formatUnits(amount, sellToken.decimals));
  }

  function handleSwapClick() {
    void requestFirmQuote();
  }

  function handleApproveClick() {
    if (wrongNetwork) {
      toast.error(
        `Wrong network. Switch to ${robinhoodChain?.name ?? "Robinhood Chain"} before approving.`,
      );
      return;
    }
    setFlow("approving");
    trackSwapEvent("approval_submitted", {
      sellToken: sellToken?.address,
      buyToken: buyToken?.address,
    });
    approval.approveExact();
  }

  useEffect(() => {
    if (approval.isConfirmed) {
      trackSwapEvent("approval_confirmed", {
        sellToken: sellToken?.address,
        buyToken: buyToken?.address,
        transactionHash: approval.hash,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approval.isConfirmed]);

  function handleConfirmSwap() {
    if (!validatedFirmQuote || !firmQuote) return;
    if (wrongNetwork) {
      toast.error(
        `Wrong network. Switch to ${robinhoodChain?.name ?? "Robinhood Chain"} before confirming.`,
      );
      return;
    }
    if (Date.now() - firmQuote.fetchedAt > QUOTE_TTL_MS) {
      toast.error("This quote has expired. Request a new quote before confirming.");
      return;
    }
    trackSwapEvent("swap_submitted", {
      sellToken: sellToken?.address,
      buyToken: buyToken?.address,
    });
    execution.executeSwap(validatedFirmQuote);
  }

  useEffect(() => {
    if (!execution.isConfirmed || !execution.receipt) return;
    const reverted = execution.receipt.status === "reverted";
    trackSwapEvent(reverted ? "swap_reverted" : "swap_confirmed", {
      sellToken: sellToken?.address,
      buyToken: buyToken?.address,
      transactionHash: execution.hash,
    });
    if (!reverted) {
      setConfirmOpen(false);
      setFlow("success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execution.isConfirmed]);

  if (!robinhoodChain) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {WALLET_NOT_CONFIGURED_MESSAGE}
      </div>
    );
  }
  // Captured as a local so its non-null narrowing survives inside closures
  // below (TS doesn't carry module-import narrowing across arrow functions).
  const chain = robinhoodChain;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card-surface space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-semibold text-foreground">Swap</h1>
          <SlippageControl slippageBps={slippageBps} onChange={setSlippageBps} />
        </div>

        <Tabs defaultValue="crypto" className="w-full">
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-full bg-muted p-1">
            <TabsTrigger
              value="crypto"
              className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              Crypto
            </TabsTrigger>
            <TabsTrigger
              value="xstock"
              className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              Xstock
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crypto" className="mt-4 space-y-4">
            {wrongNetwork ? (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
                <p>Wrong network. Swaps only work on {chain.name}.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled={isSwitching}
                  onClick={() => switchChain({ chainId: chain.id })}
                >
                  Switch to {chain.name}
                </Button>
              </div>
            ) : null}

            <div className="space-y-1">
              <SwapAmountInput
                label="Sell"
                token={sellToken}
                value={sellAmountInput}
                onChange={setSellAmountInput}
                balanceFormatted={balance.formatted}
                balanceLoading={isConnected && balance.isLoading}
                balanceError={isConnected && balance.isError}
                onRetryBalance={balance.refetch}
                tokenSelect={
                  <TokenSelect
                    tokens={availableTokens}
                    value={sellToken}
                    onChange={setSellToken}
                    onCustomTokenResolved={rememberCustomToken}
                    excludeAddress={buyToken?.address}
                    label="Sell token"
                  />
                }
                footer={
                  <SwapPercentageButtons
                    onSelect={handlePercentageSelect}
                    disabled={balance.maxSellValue === null}
                  />
                }
              />
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={() => {
                    const s = sellToken;
                    setSellToken(buyToken);
                    setBuyToken(s);
                  }}
                  aria-label="Reverse pair"
                >
                  <ArrowDownUp className="size-3.5" />
                </Button>
              </div>
              <SwapAmountInput
                label="Buy (estimated)"
                token={buyToken}
                value={
                  priceQuery.data?.data?.liquidityAvailable
                    ? String(
                        Number(priceQuery.data.data.buyAmount) / 10 ** (buyToken?.decimals ?? 18),
                      )
                    : ""
                }
                readOnly
                tokenSelect={
                  <TokenSelect
                    tokens={availableTokens}
                    value={buyToken}
                    onChange={setBuyToken}
                    onCustomTokenResolved={rememberCustomToken}
                    excludeAddress={sellToken?.address}
                    label="Buy token"
                  />
                }
              />
            </div>

            {insufficientBalance ? (
              <p className="rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative">
                Insufficient {sellToken?.symbol} balance.
              </p>
            ) : null}

            {flow === "needs-approval" ? (
              <Button
                className="w-full"
                onClick={handleApproveClick}
                disabled={approval.isApproving || approval.isConfirming}
              >
                {approval.isApproving || approval.isConfirming
                  ? "Approving…"
                  : `Approve ${sellToken?.symbol}`}
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={
                  !isConnected ||
                  Boolean(wrongNetwork) ||
                  !sellAmountBaseUnits ||
                  insufficientBalance ||
                  (priceQuery.data?.data?.priceImpactBps !== null &&
                    priceQuery.data?.data?.priceImpactBps !== undefined &&
                    priceQuery.data.data.priceImpactBps >= PRICE_IMPACT_MAX_BPS) ||
                  quoteQuery.isFetching
                }
                onClick={handleSwapClick}
              >
                {insufficientBalance
                  ? "Insufficient balance"
                  : quoteQuery.isFetching
                    ? "Fetching quote…"
                    : "Review Swap"}
              </Button>
            )}

            {priceQuery.isError ? (
              <p className="rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative">
                {priceQuery.error instanceof ApiError
                  ? priceQuery.error.message
                  : "Robinhood Mainnet market data is temporarily unavailable."}
              </p>
            ) : null}

            {priceQuery.data?.data && sellToken && buyToken ? (
              <SwapQuoteDetails
                sellToken={sellToken}
                buyToken={buyToken}
                quote={priceQuery.data.data}
                fetchedAt={Date.parse(priceQuery.data.fetchedAt ?? new Date().toISOString())}
                slippageBps={slippageBps}
              />
            ) : null}

            {flow === "success" && execution.hash ? (
              <div className="rounded-lg border border-positive/30 bg-positive/10 p-3 text-sm text-positive">
                <p className="font-medium">Transaction confirmed</p>
                <a
                  href={`${chain.blockExplorers?.default.url}/tx/${execution.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs underline"
                >
                  View on Blockscout <ExternalLink className="size-3" />
                </a>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="xstock" className="mt-4">
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Xstock swaps coming soon</p>
              <p className="mt-1">
                Tokenized equity swaps unlock once verified on-chain xStock contracts are live on
                Robinhood Mainnet.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {firmQuote && firmQuote.data.liquidityAvailable && sellToken && buyToken ? (
        <SwapConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          sellToken={sellToken}
          buyToken={buyToken}
          quote={firmQuote.data}
          fetchedAt={firmQuote.fetchedAt}
          slippageBps={slippageBps}
          onConfirm={handleConfirmSwap}
          isSubmitting={execution.isSwapping || execution.isConfirming}
        />
      ) : null}
    </div>
  );
}
