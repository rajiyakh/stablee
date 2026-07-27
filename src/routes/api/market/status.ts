import { createFileRoute } from "@tanstack/react-router";
import { getProviderRuntimeStatus } from "@/lib/market/http.server";
import { geckoTerminalConfigured, robinhoodNetworkId } from "@/lib/market/geckoterminal.server";
import { guard } from "@/lib/market/api.server";
import { gmgnConfigured } from "@/providers/gmgn/client.server";
import type { ProviderStatus, ProviderState } from "@/lib/market/types";

function stateFor(provider: string, configured: boolean): ProviderState {
  if (!configured) return "not_configured";
  const s = getProviderRuntimeStatus(provider);
  if (!s.lastSuccessAt) return s.lastFailureAt ? "unavailable" : "delayed";
  const ageMs = Date.now() - new Date(s.lastSuccessAt).getTime();
  if (s.lastFailureAt && new Date(s.lastFailureAt) > new Date(s.lastSuccessAt))
    return "unavailable";
  return ageMs < 10 * 60_000 ? "live" : "delayed";
}

export const Route = createFileRoute("/api/market/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const limited = guard(request, "status");
        if (limited) return limited;

        const robinhoodChainId = (process.env.ROBINHOOD_CHAIN_ID || "").trim();
        const dexChainId = (process.env.VITE_ROBINHOOD_DEXSCREENER_CHAIN_ID || "").trim();
        const cg = getProviderRuntimeStatus("coingecko");
        const ds = getProviderRuntimeStatus("dexscreener");
        const gt = getProviderRuntimeStatus("geckoterminal");
        const gm = getProviderRuntimeStatus("gmgn");

        const providers: ProviderStatus[] = [
          {
            id: "coingecko",
            label: "CoinGecko",
            state: stateFor("coingecko", true),
            lastSuccessAt: cg.lastSuccessAt,
            lastFailureAt: cg.lastFailureAt,
            lastError: cg.lastError,
            features: ["Global trending", "Coin search", "Prices", "Metadata", "Historical charts"],
            attribution: "Market data by CoinGecko",
            detail: process.env.COINGECKO_API_KEY
              ? "API key configured (server-side only)."
              : "Running on the public rate-limited tier — no API key configured.",
          },
          {
            id: "dexscreener",
            label: "DEX Screener",
            state: stateFor("dexscreener", true),
            lastSuccessAt: ds.lastSuccessAt,
            lastFailureAt: ds.lastFailureAt,
            lastError: ds.lastError,
            features: ["Pair search", "Pair data", "Token pairs", "Token profiles", "Boosts"],
            attribution: "DEX market data by DEX Screener",
            detail: dexChainId
              ? `Robinhood chain identifier configured: ${dexChainId}`
              : "No Robinhood chain identifier configured.",
          },
          {
            id: "geckoterminal",
            label: "GeckoTerminal",
            state: stateFor("geckoterminal", geckoTerminalConfigured()),
            lastSuccessAt: gt.lastSuccessAt,
            lastFailureAt: gt.lastFailureAt,
            lastError: gt.lastError,
            features: ["Networks", "Pools", "Trending pools", "OHLCV"],
            attribution: "Pool data by GeckoTerminal",
            detail: geckoTerminalConfigured()
              ? `Network identifier configured: ${robinhoodNetworkId()}`
              : "No network identifier configured.",
          },
          {
            id: "gmgn",
            label: "GMGN",
            state: stateFor("gmgn", gmgnConfigured()),
            lastSuccessAt: gm.lastSuccessAt,
            lastFailureAt: gm.lastFailureAt,
            lastError: gm.lastError,
            features: ["Robinhood Mainnet trending", "Robinhood Mainnet hot searches"],
            attribution: "Robinhood Mainnet market data by GMGN",
            detail: gmgnConfigured()
              ? "GMGN API key configured (server-side only)."
              : "GMGN market data is not configured. Add a valid GMGN API key to enable Robinhood Mainnet Trending and Hot Searches.",
          },
          {
            id: "robinhood",
            label: "Robinhood Mainnet",
            state: dexChainId || robinhoodChainId ? "delayed" : "not_configured",
            lastSuccessAt: dexChainId ? ds.lastSuccessAt : null,
            lastFailureAt: null,
            lastError: null,
            features: dexChainId
              ? ["Chain-filtered discovery", "Verified token registry"]
              : ["Verified token registry"],
            attribution: "Platform configuration",
            detail: dexChainId
              ? "Market discovery is filtered to the configured Robinhood chain identifier."
              : "Robinhood Mainnet market data is not available from the configured provider yet.",
          },
        ];

        return new Response(JSON.stringify({ providers, generatedAt: new Date().toISOString() }), {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
