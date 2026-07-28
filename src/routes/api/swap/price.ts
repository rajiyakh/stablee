import { createFileRoute } from "@tanstack/react-router";

import {
  envelope,
  guard,
  invalidParams,
  jsonError,
  jsonOk,
  notConfigured,
} from "@/lib/market/api.server";
import { resolveSwapToken } from "@/lib/swap/discoverTokens.server";
import { QUOTE_TTL_MS } from "@/config/swapPolicy";
import { swapPriceRequestSchema } from "@/lib/swap/requestSchemas";
import { zeroExPriceResponseSchema } from "@/lib/swap/schemas";
import { fetchZeroExPrice } from "@/lib/swap/zeroEx.server";
import { serverFeeRecipient } from "@/lib/swap/feeConfig.server";
import { resolveUsdValue } from "@/lib/swap/usdValue.server";
import { computePriceImpactBps } from "@/lib/swap/priceImpact";
import { validateQuote } from "@/lib/swap/validateQuote";

export const Route = createFileRoute("/api/swap/price")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "swap-price");
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
        const parsed = swapPriceRequestSchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return invalidParams("zeroex");

        const [sellToken, buyToken] = await Promise.all([
          resolveSwapToken(parsed.data.sellToken),
          resolveSwapToken(parsed.data.buyToken),
        ]);
        if (!sellToken || !buyToken) return invalidParams("zeroex");

        try {
          const fetchedAt = Date.now();
          const res = await fetchZeroExPrice({
            sellToken: sellToken.address,
            buyToken: buyToken.address,
            sellAmount: parsed.data.sellAmount,
            buyAmount: parsed.data.buyAmount,
            taker: parsed.data.taker,
            slippageBps: parsed.data.slippageBps,
          });
          const data = zeroExPriceResponseSchema.parse(res.data);

          if (!data.liquidityAvailable) {
            return jsonOk(
              envelope("zeroex", {
                ...res,
                data: {
                  ...data,
                  sellUsd: null,
                  feeUsd: null,
                  validation: { ok: false, issues: [{ code: "no_liquidity" }] },
                },
              }),
              0,
            );
          }

          const [sellUsdResult, buyUsdResult] = await Promise.all([
            resolveUsdValue(sellToken.address, data.sellAmount, sellToken.decimals),
            resolveUsdValue(buyToken.address, data.buyAmount, buyToken.decimals),
          ]);
          const priceImpactBps = computePriceImpactBps(sellUsdResult.usd, buyUsdResult.usd);

          let feeUsd: number | null = null;
          const fee = data.fees?.integratorFee;
          if (fee) {
            // selectFeeToken() only ever returns sellToken or buyToken, so the
            // fee token is always one of the two we already resolved above.
            const feeTokenConfig =
              fee.token.toLowerCase() === sellToken.address.toLowerCase() ? sellToken : buyToken;
            const feeUsdResult = await resolveUsdValue(
              feeTokenConfig.address,
              fee.amount,
              feeTokenConfig.decimals,
            );
            feeUsd = feeUsdResult.usd;
          }

          const validation = validateQuote(data, {
            expectedSellToken: sellToken.address,
            expectedBuyToken: buyToken.address,
            fetchedAt,
            quoteTtlMs: QUOTE_TTL_MS,
            requireTransaction: false,
            priceImpactBps,
          });

          return jsonOk(
            envelope("zeroex", {
              ...res,
              fetchedAt: new Date(fetchedAt).toISOString(),
              data: {
                ...data,
                sellUsd: sellUsdResult.usd,
                sellUsdSource: sellUsdResult.source,
                buyUsd: buyUsdResult.usd,
                priceImpactBps,
                feeUsd,
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
