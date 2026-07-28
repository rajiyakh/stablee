# Portfolio Setup

`/portfolio` shows every token a connected wallet holds on Robinhood Mainnet, each priced live,
using Blockscout — the same explorer already wired as `robinhoodChain.blockExplorers.default.url`
(`VITE_ROBINHOOD_EXPLORER_URL`, confirmed live at `robinhoodchain.blockscout.com`). No separate
API key or config is required beyond the existing `VITE_ROBINHOOD_*` wallet env vars — if
`isWalletConfigured()` is true, Portfolio works.

## The two endpoints this feature calls

Both confirmed live by curling them directly before building anything on top of them (never assume
an API shape from docs/memory — verify it):

```
GET {explorerUrl}/api/v2/addresses/{address}
```
Returns `coin_balance` (native ETH, wei) and `exchange_rate` (native coin's live USD price).

```
GET {explorerUrl}/api/v2/addresses/{address}/token-balances
```
Returns every ERC-20 the address holds — no enumeration hack, no per-token RPC loop. Each entry
carries `token.symbol`, `token.name`, `token.decimals`, `token.icon_url` (real CDN image),
`token.exchange_rate` (live USD price per token), `token.reputation`, and `value` (raw balance).

This is the reason "all tokens" is honestly buildable: Blockscout already indexes every transfer
in/out of the address, so this list is complete and accurate without RobinPulse having to guess
which tokens might be relevant.

## Where the code lives

- `src/lib/portfolio/blockscout.server.ts` — the two raw fetches, via the same `fetchJson()`
  caching/timeout/retry core every other provider in this app uses (`src/lib/market/http.server.ts`).
- `src/lib/portfolio/holdings.server.ts` — combines both responses into one `PortfolioData` (native
  ETH folded in as a regular holding, decimals/symbol parsed defensively — a token missing either
  is dropped rather than guessed, same discipline as `discoverTokens.server.ts`).
- `src/routes/api/portfolio/holdings.ts` — `GET ?address=0x...`, same `envelope()`/`guard()` shape
  as every other API route in this app.
- `src/lib/portfolio/client.ts` — the `PortfolioData`/`PortfolioHolding` types (shared with the
  client) and the TanStack Query wrapper.
- `src/features/portfolio/PortfolioPage.tsx` + `src/routes/portfolio.tsx` — the UI, lazy-loaded like
  `SwapPage.tsx` since it also depends on `useAccount()`/Privy.

## Reputation, not hiding — and why Blockscout's own reputation field isn't enough

Every holding the API returns is shown — nothing is dropped for looking unfamiliar or being dust.
A token gets a visible "Flagged" badge (never dropped) when either:
- Blockscout didn't mark its `reputation` as `"ok"`, or
- its raw name/symbol is abnormally long (`MAX_NAME_LENGTH` / `MAX_SYMBOL_LENGTH` in
  `holdings.server.ts`).

The second rule exists because of something found live while building this: a real wallet on this
chain holds an airdropped token whose *name* field is a phishing payload — `"rh-compliance.xyz |
TRM LABS ALERT: Your Robinhood Chain wallet flagged by automated risk-scoring system (score
94/100 - HIGH RISK). All assets TEMPORARILY FROZEN pending KYC verification. Verify at
rh-compliance.xyz within 72h..."` — and Blockscout's own `reputation` field reported `"ok"` for it
(their reputation system catches known scam *contracts*, not deceptive *metadata*). Anyone can set
a token's name to anything; this is a well-known attack pattern (airdrop a token with a scary
"official-looking" name, hoping the holder panics and visits the embedded domain).

`holdings.server.ts` hard-truncates every name/symbol server-side (never just via CSS `truncate`,
which only clips the *display* — the full string would still reach the client and could surface
elsewhere, e.g. a screen reader or a wider viewport) and flags anything that had to be truncated.
No real token name is anywhere near 40 characters, so this has no legitimate false-positive cost.

## Caching

The overview endpoint is cached 20s server-side. The token-balances endpoint is cached 45s and
given a generous 28s timeout with no retry — confirmed live that it can genuinely take 20-35s for
a wallet with a large transfer history (Blockscout enumerating its own index), and retrying a
slow-but-working call only doubles the wait. The client query itself uses a 15s `staleTime`;
there's no aggressive polling here (unlike the swap page's live quote) since a portfolio view
doesn't need second-by-second freshness.
