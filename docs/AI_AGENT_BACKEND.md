# AI Agent Backend

## What exists today

`src/lib/agents.ts` defines 8 static analyst personas — Vector, Meridian, Revert, FlowState, Ledger, Echo, Atlas, Parallax — each with hand-written methodology/inputs/limitations copy. There is **no model, no inference, and no live call generation**. `emptyAgentStats()` always returns zero/null stats (`totalCalls: 0, scoredCalls: 0, accuracy: null, averageReturn: null, currentStreak: null`) by design — this is not a bug to fix, it's the correct state until a real backend exists.

The AI Feed (`/ai-feed`) additionally shows **deterministic, non-AI "Automated Market Summary" cards** (`src/lib/feed/summaries.ts`), built from live CoinGecko/DEX Screener data with a fixed template — never claimed to be written by a model.

## Data model already in place for a future backend

`src/lib/calls/types.ts` defines the shape a real call-publishing service must produce:

```ts
export interface MarketCall {
  id: string;
  asset: {
    kind: "coin" | "dex";
    id: string;
    symbol: string;
    name: string;
    chainId?: string;
    address?: string;
  };
  agentSlug: string;
  direction: "long" | "short" | "neutral";
  confidence: number;
  referencePrice: number;
  target: number | null;
  invalidation: number | null;
  timeHorizon: "intraday" | "swing" | "position";
  evidence: string[];
  dataProvider: string;
  publishedAt: string;
  trackingStart: string;
  expiresAt: string | null;
  status: "pending" | "tracking" | "hit" | "missed" | "invalidated" | "expired";
  finalResult: { exitPrice: number; returnPercent: number; closedAt: string } | null;
  score: number | null;
}
```

Plus `CallEvent` — an append-only status-change record, so a call's history can never be silently rewritten.

## What a real backend needs to provide

1. **Persistence** — a database (Supabase/Postgres is already part of this workspace's broader stack) storing `MarketCall` rows and their `CallEvent` history, append-only.
2. **Publishing** — a trusted process (human-reviewed or model-driven) that creates a `MarketCall` at `status: "pending"` with a real `referencePrice` pulled from the same CoinGecko/DEX Screener data this app already fetches.
3. **Scoring** — a job that transitions `status` over time (`tracking` → `hit`/`missed`/`invalidated`/`expired`) and computes `finalResult`/`score` using the weights already defined in `src/config/trending.ts`'s `scoringConfig` (`directionalAccuracy`, `riskAdjustedReturn`, `targetEfficiency`, `confidenceCalibration`, `consistency`).
4. **API routes** — new `/api/calls/**` endpoints following the exact same envelope/Zod-validation/rate-limiting pattern already used by `/api/market/**` (see `src/lib/market/api.server.ts`).

Until all four exist, `/ai-feed`'s "Agent calls" section and `/agents/$slug`'s track record correctly show empty/zero states — do not backfill them with sample data.
