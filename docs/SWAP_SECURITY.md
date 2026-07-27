# Swap Security

Focused security review performed while building `/swap`, covering the risk list the spec
required, **plus an independent second-pass review** using a dedicated security-reviewer agent
after the feature was built — not a substitute for a real external audit, but a genuine second
set of eyes over the same code. This is a code review of what was built, not a penetration test
of a live deployment — no real API key or treasury address existed to test against.

## Independent second-pass findings and fixes

The second pass confirmed the fee-recipient/fee-bps tampering, arbitrary-spender-approval, and
calldata-modification surfaces are sound, and found three real gaps, all now fixed:

- **Price impact was computed but never enforced (HIGH).** `PRICE_IMPACT_MAX_BPS` was defined and
  displayed with copy claiming "This swap is blocked by default," but nothing actually blocked
  it. Fixed: `validateQuote()` now takes `priceImpactBps` in its context and adds a
  `price_impact_severe` issue when it's ≥3%; `/api/swap/quote` returns a hard `customError` for
  it (so a swap literally cannot be submitted), and the "Review Swap" button is disabled
  pre-flight when the indicative price already shows severe impact.
- **Wrong-chain execution wasn't re-checked at signing time (MEDIUM).** The `chainId !==
  robinhoodChain.id` check only gated the initial quote request, not the actual approve/confirm
  actions — if the wallet's active chain changed between quote-fetch and confirm-click, nothing
  stopped signing on the wrong chain. Fixed: `useTokenApproval.ts` and `useSwapExecution.ts` now
  pass an explicit `chainId: robinhoodChain.id` to wagmi's `writeContract`/`sendTransaction` (so
  wagmi itself enforces or prompts a switch), and `handleApproveClick`/`handleConfirmSwap` in
  `SwapPage.tsx` re-check `wrongNetwork` immediately before acting, as defense in depth.
- **Firm-quote staleness wasn't enforced at the confirm-dialog stage (MEDIUM).** The 30s TTL check
  only ran once, moments after the quote was fetched server-side — the real staleness window
  (however long the user leaves the confirm dialog open) was never checked. Fixed: a shared
  `useQuoteAge` hook now drives a live countdown in `SwapConfirmDialog.tsx`, disables "Confirm
  Swap" once expired, and `handleConfirmSwap` re-checks the age defensively before executing.

Two lower-severity items were also fixed: 0x response fields that feed security-relevant
decisions (`spender`, `transaction.to`, `sellToken`/`buyToken`, `fee.token`) are now shape-
validated as real EVM addresses in `schemas.ts` (previously plain strings) — a malformed address
now fails loudly at the Zod-parse boundary instead of silently reaching a signing call; and the
`/api/swap/price` cache key now includes `slippageBps` (previously two requests for the same pair
at different slippage within the 3s TTL could return a response computed for the wrong slippage).

Two items were reviewed and assessed as low-risk without a code change: JS `Number` precision in
the advisory USD minimum-swap/minimum-fee gate (bounded to those business-rule checks only —
settled amounts and the on-chain fee stay BigInt end-to-end); and `guard()`'s IP detection
trusting `x-forwarded-for` as a fallback (shared app-wide infrastructure, not swap-specific —
Vercel's edge network normalizes this header before requests reach the app).

## Risks reviewed, and how each is addressed

**API key leakage** — `ZEROX_API_KEY` is read only inside `src/lib/swap/zeroEx.server.ts` (a
`.server.ts` file; this repo's ESLint config fails the build if such a file is imported from
client code). Confirmed post-build: zero matches for the key in `.vercel/output/static`.

**Fee-recipient tampering** — `src/lib/swap/requestSchemas.ts`'s Zod schemas for both API routes
have no `swapFeeRecipient` field at all. Zod's default `z.object()` behavior strips unrecognized
keys, so a client sending `swapFeeRecipient=attacker` has that field silently dropped before it
ever reaches `zeroEx.server.ts`. Proven directly in `requestSchemas.test.ts` (parses a payload
containing every tampering field and asserts none of them survive). The recipient is set exactly
once, in `feeConfig.server.ts`, from `ROBINPULSE_FEE_RECIPIENT`.

**Fee-BPS tampering** — same mechanism: no `swapFeeBps` field in the request schema, and
`computeSwapFeeBps()` clamps to a hardcoded 30 bps ceiling regardless of any override passed
internally, which itself is only ever `serverFeeBps()`'s env-read value — never client input.

**Quote manipulation** — `zeroExPriceResponseSchema`/`zeroExQuoteResponseSchema` (Zod) validate
every field's shape before the app trusts it. `validateQuote()` additionally checks token
addresses match the request, liquidity is available, fees are present and sufficient, and the
quote isn't expired, before the client is ever allowed to act on it.

**Calldata modification** — `useSwapExecution.ts`'s `executeSwap()` sends `transaction.to`,
`.data`, `.value`, `.gas` from the validated 0x response verbatim. Nothing in the codebase
parses, decodes, or reconstructs the calldata.

**Wrong-chain transactions** — `chainId=4663` is hardcoded in `zeroEx.server.ts`, never read
from client input. `SwapPage.tsx` detects `chainId !== robinhoodChain.id` and blocks the swap UI
with a "Switch to Robinhood Chain" prompt; this is re-checked immediately before both the
approve and confirm actions (not just the initial quote request — see the independent-review
section below for why that distinction mattered), and `useTokenApproval.ts`/`useSwapExecution.ts`
also pass an explicit `chainId` to wagmi so it enforces or prompts a switch at signing time too.

**Malicious token metadata** — the token picker is restricted to the curated `swapTokens.ts`
registry for V1 (see `docs/0X_SWAP_SETUP.md`'s scope note) — a request for a token outside that
list is rejected with `invalid_params` before any USD-value or fee logic runs, rather than
trusting an arbitrary client-supplied address's claimed decimals/symbol.

**Arbitrary spender approvals / unlimited approvals** — `useTokenApproval.ts` is the only place
in the codebase that calls ERC-20 `approve()`. Its `spender` value is read only from
`quote.issues.allowance.spender` on a `ValidatedQuote` (a nominally-branded type only producible
by `validateQuote()`'s success branch — passing a raw, unvalidated response is a TypeScript
compile error, not just a runtime check). The approval amount defaults to the exact
`quote.sellAmount`, never `maxUint256`.

**Address poisoning** — every address the UI trusts (sell/buy token, fee recipient, allowance
spender, transaction target) comes from either hardcoded confirmed config (`swapTokens.ts`) or
the validated 0x response — never copy-pasted user input rendered back as a trusted value.

**Decimal handling / integer precision** — every token amount that crosses the wallet boundary
goes through viem's `parseUnits`/`formatUnits` (BigInt-based). JavaScript floating-point
arithmetic is never used on base-unit amounts — verified directly in `decimals.test.ts` (large
amounts, low-price/high-decimal tokens, 6- vs 18-decimal tokens).

**Stale quotes** — `validateQuote()` rejects any quote older than `QUOTE_TTL_MS` (30s, app-side —
the API has no real expiry field). The approval flow explicitly re-fetches the firm quote after
an approval transaction confirms, per the spec's requirement, rather than reusing a
possibly-stale one. `SwapConfirmDialog.tsx` also shows a live countdown and disables "Confirm
Swap" once the open dialog's quote goes stale — not just a one-time server-side check.

**Unsafe external links** — the block-explorer transaction link uses `target="_blank"
rel="noopener noreferrer"`, same convention as the rest of the site's external links (e.g.
`ExternalTradeConfirmation.tsx`).

**RPC failures** — `chainlink.server.ts`'s `readContract` call is wrapped in try/catch and
returns `null` on any failure (network error, revert, stale data), which `resolveUsdValue()`
treats as "try the next tier," never as a crash or a fabricated price.

**Approval race conditions** — the flow is strictly sequential: approve → wait for confirmation
(`useWaitForTransactionReceipt`) → re-fetch quote → show review dialog. The Swap button is not
enabled during an in-flight approval.

**Front-running / slippage** — `slippageBps` is passed through to 0x on every request (default
50 bps / 0.5%, per `swapPolicy.ts`), and `minBuyAmount` from the firm quote is what actually
protects the user onchain — RobinPulse doesn't reimplement slippage protection outside of what
0x's own contracts already enforce.

**Fee-on-transfer / buy-sell tax tokens** — `tokenMetadata.{buyToken,sellToken}.{buyTaxBps,
sellTaxBps,transferTaxBps}` are captured in the Zod schema (`schemas.ts`) and surfaced via
`src/lib/swap/tokenTax.ts`'s `detectTokenTax()`, shown as a warning banner in both
`SwapQuoteDetails.tsx` (pre-flight) and `SwapConfirmDialog.tsx` (final confirmation) whenever any
tax field is ≥0.01%. Never estimated — only shown when the provider actually reported a value.

**Reentrancy** — not RobinPulse's surface; the swap executes via 0x's own audited AllowanceHolder
contract, which is the entire reason a custom RobinPulse contract was deliberately not built.

**XSS** — no `dangerouslySetInnerHTML` anywhere in the swap feature; all values are rendered
through normal JSX text interpolation, which React escapes by default.

**Server-side request abuse** — every swap route goes through the existing `guard()` rate
limiter (same mechanism as every other API route in the app) before doing any work.

## Remaining risks / production recommendations

- The native-ETH sentinel address is unconfirmed against a live 0x response (a real
  `ZEROX_API_KEY` is required to test this — an unauthenticated probe was attempted and
  confirmed the API rejects the request before even parsing the token addresses) — native
  selling ships disabled until that's verified (see `docs/0X_SWAP_SETUP.md`).
- The curated token registry now includes 4 tokens (WETH, USDG, AAPL, AMZN) plus GMGN-discovered,
  on-chain-decimals-verified tokens when `GMGN_API_KEY` is configured (`discoverTokens.server.ts`)
  — the "chain+address identity, never symbol matching" discipline is applied throughout.
- This review (both passes) is based on code inspection and unit tests against fixtures — commission
  a real independent/external security audit, and complete real testnet/small-mainnet swaps,
  before handling meaningful user funds. See the Production Launch Checklist in
  `docs/0X_SWAP_SETUP.md`.
