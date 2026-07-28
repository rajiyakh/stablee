// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Security headers applied to every response. Set here (not in a top-level
// vercel.json) because prebuilt deploys (`vercel deploy --prebuilt`) only read
// `.vercel/output/config.json`, which Nitro generates from these route rules —
// a hand-written vercel.json is silently ignored for that deploy path.
// `'unsafe-inline'` is required in script-src: TanStack Start's SSR hydration
// payload is an inline <script> with no nonce/hash infra in this app (would
// need per-request nonce generation wired through the Nitro render pipeline —
// out of scope here). This still blocks loading any *external* script host
// other than the one explicit TradingView allowlist entry, which is the more
// load-bearing protection for this app (no third-party script injection).
//
// connect-src/frame-src/script-src also allowlist Privy + WalletConnect
// origins (per docs.privy.io/security/implementation-guide/content-security-policy)
// so wallet connect doesn't silently break the moment VITE_WALLET_ENABLED
// flips true — added ahead of go-live since a CSP violation fails closed
// with no visible error to the developer testing it.
//
// connect-src also allowlists the Robinhood Chain RPC directly — every
// client-side on-chain read (wallet balance via wagmi's useReadContract/
// useBalance) goes straight from the browser to this RPC, not through our
// own API. This was missing entirely (connect-src was just 'self' before
// any Privy work), so it silently blocked every balance read in production
// from the moment wallet connect went live — worked in local dev (no CSP
// applied there) and looked identical to a query stuck loading forever
// (a CSP-blocked fetch throws, exhausting wagmi/react-query's retries
// with no visible error) rather than an obvious CSP violation. Found by
// comparing a live production network trace against local dev, not
// guessed — see the balance-display fix in useSwapTokenBalance.ts.
const ROBINHOOD_RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const securityHeaders = {
  "Content-Security-Policy": `default-src 'self'; script-src 'self' 'unsafe-inline' https://s3.tradingview.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ${ROBINHOOD_RPC_URL} https://auth.privy.io https://*.rpc.privy.systems https://explorer-api.walletconnect.com wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org; frame-src https://dexscreener.com https://www.tradingview-widget.com https://s.tradingview.com https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'`,
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    // @ts-expect-error — LovableViteTanstackOptions['nitro'] deliberately omits routeRules
    // (package comment: "narrow on purpose, file an issue if you need more"), but the runtime
    // spreads this object straight into nitro/vite's real NitroConfig, which does support it.
    routeRules: {
      "/**": { headers: securityHeaders },
    },
  },
});
