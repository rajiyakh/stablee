import { createFileRoute } from "@tanstack/react-router";

import {
  customError,
  envelope,
  guard,
  invalidParams,
  jsonError,
  jsonOk,
  notConfigured,
} from "@/lib/market/api.server";
import { resolveSwapToken } from "@/lib/swap/discoverTokens.server";
import { QUOTE_TTL_MS } from "@/config/swapPolicy";
import { swapQuoteRequestSchema } from "@/lib/swap/requestSchemas";
import { zeroExQuoteResponseSchema } from "@/lib/swap/schemas";
import { fetchZeroExQuote } from "@/lib/swap/zeroEx.server";
import { serverFeeRecipient, serverMinSwapUsd } from "@/lib/swap/feeConfig.server";
import { resolveUsdValue } from "@/lib/swap/usdValue.server";
import { meetsMinimumSwap } from "@/lib/swap/fees";
import { computePriceImpactBps } from "@/lib/swap/priceImpact";
import { validateQuote } from "@/lib/swap/validateQuote";

export const Route = createFileRoute("/api/swap/quote")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "swap-quote");
        if (limited) return limited;

        if (!process.env.ZEROX_API_KEY) {
          return notConfigured(
            "zeroex",
            "0x swap data is not configured. Add a valid 0x API key to enable swaps.",
          );
        }
        if (!serverFeeRecipient()) {
          return notConfigured(
            "zeroex",
            "RobinPulse fee collection has not been configured. Live swapping is unavailable.",
          );
        }

        const url = new URL(request.url);
        const parsed = swapQuoteRequestSchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return invalidParams("zeroex");

        const [sellToken, buyToken] = await Promise.all([
          resolveSwapToken(parsed.data.sellToken),
          resolveSwapToken(parsed.data.buyToken),
        ]);
        if (!sellToken || !buyToken) return invalidParams("zeroex");

        try {
          const fetchedAt = Date.now();

          // Re-verify the minimum-swap-USD gate right before requesting the firm,
          // executable quote — prices can move between the price-preflight call
          // and this one.
          const sellUsdResult = await resolveUsdValue(
            sellToken.address,
            parsed.data.sellAmount ?? "0",
            sellToken.decimals,
          );
          const minSwapUsd = serverMinSwapUsd();
          if (!meetsMinimumSwap(sellUsdResult.usd, minSwapUsd)) {
            return sellUsdResult.usd === null
              ? customError(
                  "zeroex",
                  "usd_value_unavailable",
                  "Unable to verify the USD value of this trade. RobinPulse cannot confirm the minimum platform fee, so this swap cannot be submitted.",
                )
              : customError(
                  "zeroex",
                  "below_minimum_swap",
                  `Minimum swap amount is $${minSwapUsd} to cover the RobinPulse platform fee.`,
                );
          }

          const res = await fetchZeroExQuote({
            sellToken: sellToken.address,
            buyToken: buyToken.address,
            sellAmount: parsed.data.sellAmount,
            buyAmount: parsed.data.buyAmount,
            taker: parsed.data.taker,
            slippageBps: parsed.data.slippageBps,
          });
          const data = zeroExQuoteResponseSchema.parse(res.data);

          let feeUsd: number | null = null;
          let buyUsd: number | null = null;
          if (data.liquidityAvailable) {
            buyUsd = (await resolveUsdValue(buyToken.address, data.buyAmount, buyToken.decimals))
              .usd;
            const fee = data.fees?.integratorFee;
            if (fee) {
              const feeTokenConfig =
                fee.token.toLowerCase() === sellToken.address.toLowerCase() ? sellToken : buyToken;
              const feeUsdResult = await resolveUsdValue(
                feeTokenConfig.address,
                fee.amount,
                feeTokenConfig.decimals,
              );
              feeUsd = feeUsdResult.usd;
            }
          }
          const priceImpactBps = computePriceImpactBps(sellUsdResult.usd, buyUsd);

          const validation = validateQuote(data, {
            expectedSellToken: sellToken.address,
            expectedBuyToken: buyToken.address,
            fetchedAt,
            quoteTtlMs: QUOTE_TTL_MS,
            feeUsd,
            requireTransaction: true,
            priceImpactBps,
          });

          if (!validation.ok && validation.issues.some((i) => i.code === "fee_below_minimum")) {
            return customError(
              "zeroex",
              "fee_below_minimum",
              "The current quote does not meet the minimum platform fee requirement. Increase the swap amount and request a new quote.",
            );
          }

          if (!validation.ok && validation.issues.some((i) => i.code === "price_impact_severe")) {
            return customError(
              "zeroex",
              "price_impact_severe",
              `Price impact is ${((priceImpactBps ?? 0) / 100).toFixed(2)}%, above the safety threshold. This swap is blocked.`,
            );
          }

          return jsonOk(
            envelope("zeroex", {
              ...res,
              fetchedAt: new Date(fetchedAt).toISOString(),
              data: {
                ...data,
                sellUsd: sellUsdResult.usd,
                buyUsd,
                priceImpactBps,
                feeUsd,
                minSwapUsd,
                validation,
              },
            }),
            0,
          );
        } catch (error) {
          return jsonError("zeroex", error);
        }
      },
    },
  },
});
