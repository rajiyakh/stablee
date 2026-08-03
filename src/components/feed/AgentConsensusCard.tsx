import { ShieldAlert } from "lucide-react";
import { agentDisplayName } from "@/lib/feed/consensus";
import { relativeTime } from "@/lib/market/format";
import type { ConsensusSummary } from "@/lib/feed/types";

const labelText: Record<ConsensusSummary["label"], string> = {
  strong_bullish: "Strong Bullish",
  moderate_bullish: "Moderate Bullish",
  neutral: "Neutral",
  moderate_bearish: "Moderate Bearish",
  strong_bearish: "Strong Bearish",
  avoid: "Avoid",
  insufficient_data: "Insufficient Data",
};

const labelTone: Record<ConsensusSummary["label"], string> = {
  strong_bullish: "bg-positive/15 text-positive",
  moderate_bullish: "bg-positive/10 text-positive",
  neutral: "bg-muted text-muted-foreground",
  moderate_bearish: "bg-negative/10 text-negative",
  strong_bearish: "bg-negative/15 text-negative",
  avoid: "bg-negative/15 text-negative",
  insufficient_data: "bg-muted text-muted-foreground",
};

export function AgentConsensusCard({ consensus }: { consensus: ConsensusSummary }) {
  return (
    <div className="rounded-xl border border-border bg-card backdrop-blur-md p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">
          {consensus.token.symbol} consensus
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${labelTone[consensus.label]}`}
        >
          {labelText[consensus.label]}
        </span>
      </div>

      {consensus.riskOverride ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-negative">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          Risk warning may override bullish consensus
        </p>
      ) : null}

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-[10px] uppercase text-muted-foreground">Bullish</dt>
          <dd className="text-foreground">
            {consensus.bullishAgents.length
              ? consensus.bullishAgents.map(agentDisplayName).join(", ")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-muted-foreground">Bearish</dt>
          <dd className="text-foreground">
            {consensus.bearishAgents.length
              ? consensus.bearishAgents.map(agentDisplayName).join(", ")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-muted-foreground">Neutral</dt>
          <dd className="text-foreground">
            {consensus.neutralAgents.length
              ? consensus.neutralAgents.map(agentDisplayName).join(", ")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-muted-foreground">Avoid</dt>
          <dd className="text-foreground">
            {consensus.avoidAgents.length
              ? consensus.avoidAgents.map(agentDisplayName).join(", ")
              : "—"}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Avg. confidence{" "}
        {consensus.averageConfidence !== null
          ? `${Math.round(consensus.averageConfidence * 100)}%`
          : "—"}
        {" · "}
        Updated {relativeTime(consensus.updatedAt)}
      </p>
    </div>
  );
}
