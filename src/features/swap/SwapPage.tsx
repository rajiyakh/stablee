import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseUnits } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowDownUp, ExternalLink, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { robinhoodChain } from "@/config/robinhoodChain";
import {
  swapTokens,
  WETH_ADDRESS,
  USDG_ADDRESS,
  findSwapToken,
  type SwapTokenConfig,
} from "@/config/swapTokens";
import { PRICE_IMPACT_MAX_BPS, QUOTE_TTL_MS, SLIPPAGE_DEFAULT_BPS } from "@/config/swapPolicy";
import {
  resolveTokenQuery,
  swapPriceQuery,
  swapQuoteQuery,
  swapTokensQuery,
  type SwapQuoteData,
} from "@/lib/swap/client";
import { trackSwapEvent } from "@/lib/swap/analytics";
import { ApiError } from "@/lib/market/client";
import { shortenAddress } from "@/lib/market/format";
import { TokenSelect } from "./TokenSelect";
import { SwapAmountInput } from "./SwapAmountInput";
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
  const { ready: privyReady, connectWallet, logout } = usePrivy();
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
  const [slippageBps, setSlippageBps] = useState(SLIPPAGE_DEFAULT_BPS);
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

  const priceParams = {
    sellToken: sellToken?.address ?? "",
    buyToken: buyToken?.address ?? "",
    sellAmount: sellAmountBaseUnits || undefined,
    taker: address,
    slippageBps,
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
      // fee_below_minimum and price_impact_severe are pre-empted server-side
      // (see /api/swap/quote's customError branches) and surface via the
      // result.error path above, not here — this only covers the remaining
      // issue codes (token_mismatch, missing_transaction, balance_issue,
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
        Wallet integration is not yet configured.
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
          <div className="flex items-center gap-1.5">
            <SlippageControl slippageBps={slippageBps} onChange={setSlippageBps} />
            {isConnected ? (
              <Button variant="outline" size="sm" onClick={() => logout()} className="gap-1.5">
                <Wallet className="size-3.5" />
                {shortenAddress(address, 4)}
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!privyReady}
                onClick={() => connectWallet()}
                className="gap-1.5"
              >
                <Wallet className="size-3.5" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span>Audited infrastructure</span>
          <span aria-hidden="true">·</span>
          <span>No custody</span>
          <span aria-hidden="true">·</span>
          <span>Transparent 0.10% fee</span>
        </p>

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
            onMax={
              balance.maxSellFormatted
                ? () => setSellAmountInput(balance.maxSellFormatted!)
                : undefined
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
                ? String(Number(priceQuery.data.data.buyAmount) / 10 ** (buyToken?.decimals ?? 18))
                : ""
            }
            readOnly
          />
        </div>

        <div className="flex gap-2">
          <TokenSelect
            tokens={availableTokens}
            value={sellToken}
            onChange={setSellToken}
            onCustomTokenResolved={rememberCustomToken}
            excludeAddress={buyToken?.address}
            label="Sell token"
          />
          <TokenSelect
            tokens={availableTokens}
            value={buyToken}
            onChange={setBuyToken}
            onCustomTokenResolved={rememberCustomToken}
            excludeAddress={sellToken?.address}
            label="Buy token"
          />
        </div>

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

        {priceQuery.data?.data && !priceQuery.data.data.meetsMinimumSwap ? (
          <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            {priceQuery.data.data.sellUsd === null
              ? "Unable to verify the USD value of this trade. RobinPulse cannot confirm the minimum platform fee, so this swap cannot be submitted."
              : `Minimum swap amount is $${priceQuery.data.data.minSwapUsd} to cover the RobinPulse platform fee.`}
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
              !priceQuery.data?.data?.meetsMinimumSwap ||
              (priceQuery.data?.data?.priceImpactBps !== null &&
                priceQuery.data?.data?.priceImpactBps !== undefined &&
                priceQuery.data.data.priceImpactBps >= PRICE_IMPACT_MAX_BPS) ||
              quoteQuery.isFetching
            }
            onClick={handleSwapClick}
          >
            {quoteQuery.isFetching ? "Fetching quote…" : "Review Swap"}
          </Button>
        )}

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
