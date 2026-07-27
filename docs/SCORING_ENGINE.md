# Scoring Engine

This documents the trend-score algorithm that already exists and runs today (`src/config/trending.ts` + `src/lib/market/trending.ts`) — it is not new, just previously undocumented. It powers the "Robinhood Trends" (`/trending`) chain tab and the `TrendScoreBadge` tooltip copy site-wide.

## Trend score

A platform-calculated composite, **never** a value taken directly from a provider. Computed only when at least `minimumComponents` (4 of 6) of the inputs below are present for a market — otherwise no score is shown at all (`trendScore: null`), rather than a score computed from partial/missing data.

| Component            | Weight |
| -------------------- | ------ |
| Volume acceleration  | 0.25   |
| Transaction activity | 0.20   |
| Liquidity            | 0.20   |
| Momentum             | 0.15   |
| Buy pressure         | 0.10   |
| Consistency          | 0.10   |

Weights sum to 1. Each component is normalized against a ceiling (`normalisation` in `trending.ts`, e.g. liquidity ceiling $2M, 24h volume ceiling $5M) and clamped to `[0, 1]` before weighting.

Promotional boosts (DEX Screener paid boosts) are tracked (`boostAmount`) and surfaced as a separate `promotional_boost` risk flag — they never contribute to the score itself (`treatBoostsAsPromotional: true`).

## Safeguards (anti-manipulation)

| Safeguard                                 | Threshold     |
| ----------------------------------------- | ------------- |
| Minimum liquidity to score at all         | $5,000        |
| Minimum pair age to score at all          | 60 minutes    |
| Minimum 24h transactions to score at all  | 25            |
| Extreme price-change flag                 | ±60%          |
| Suspicious volume-to-liquidity ratio flag | 25x           |
| Low-liquidity flag                        | below $25,000 |
| New-pair flag                             | under 24h old |
| Buy/sell imbalance flag                   | 5x ratio      |

## Filters

- Stablecoin base tokens excluded (`STABLECOIN_SYMBOLS`)
- Wrapped-native base tokens excluded (`WRAPPED_NATIVE_SYMBOLS`)
- Duplicate pairs for the same base token deduplicated, highest-liquidity pair kept

## Risk flags

`detectRisks()` (`src/lib/market/trending.ts`) evaluates each market against the safeguards above and returns zero or more of: `limited_data`, `low_liquidity`, `high_volatility`, `new_pair`, `buy_sell_imbalance`, `promotional_boost`, `suspicious_volume`, `verification_unavailable`. Rendered via `RiskFlags` with a tooltip explaining each one is "derived from live provider data against the platform's published safeguard thresholds."

## Agent call scoring (future)

`scoringConfig` in the same file already defines the weighting a future real-call scoring job should use (`directionalAccuracy` 0.35, `riskAdjustedReturn` 0.25, `targetEfficiency` 0.15, `confidenceCalibration` 0.15, `consistency` 0.10) and `minimumScoredCalls: 10` — the sample-size floor the Leaderboard (`/leaderboard`) requires before ranking any agent. See docs/AI_AGENT_BACKEND.md.
