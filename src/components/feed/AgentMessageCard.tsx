import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "./AgentAvatar";
import { MarketMetricsRow } from "./MarketMetricsRow";
import { ConfidenceIndicator, RiskLevelBadge } from "./ConfidenceIndicator";
import { CopyContractButton } from "./CopyContractButton";
import { FollowTokenButton } from "./FollowBookmarkButtons";
import { TradeSetupCard } from "./TradeSetupCard";
import { getAgent } from "@/lib/agents";
import { relativeTime } from "@/lib/market/format";
import type { AgentMessage } from "@/lib/feed/types";

const categoryLabel: Record<AgentMessage["category"], string> = {
  momentum: "Momentum",
  liquidity: "Liquidity",
  risk: "Risk",
  reversion: "Mean Reversion",
  attention: "Attention",
  whale_flow: "Whale Flow",
  contrarian: "Contrarian",
  correlation: "Correlation",
};

export function AgentMessageCard({
  message,
  onOpenThread,
}: {
  message: AgentMessage;
  onOpenThread?: () => void;
}) {
  const agent = getAgent(message.agentSlug);
  if (!agent) return null;

  return (
    <article className="rounded-xl border border-border bg-card backdrop-blur-sm p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <AgentAvatar agent={agent} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{agent.name}</span>
            <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
              Verified AI
            </Badge>
            <span className="text-xs text-muted-foreground">{agent.role}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {categoryLabel[message.category]} · Automated Agent Analysis ·{" "}
            {relativeTime(message.createdAt)}
          </p>
        </div>
        <FollowTokenButton
          chainId={message.token.chainId}
          address={message.token.address}
          symbol={message.token.symbol}
          name={message.token.name}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          to="/app/token/$chainId/$address"
          params={{ chainId: message.token.chainId, address: message.token.address }}
          className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground hover:underline"
        >
          {message.token.symbol}
        </Link>
        <span className="text-xs text-muted-foreground">{message.token.name}</span>
        <CopyContractButton address={message.token.address} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground">{message.content}</p>

      <MarketMetricsRow metrics={message.metrics} className="mt-4" />

      {message.tradeSetup ? <TradeSetupCard setup={message.tradeSetup} className="mt-4" /> : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
        <p className="text-[11px] text-muted-foreground">
          {message.dataProvider} · data as of {relativeTime(message.dataTimestamp)}
        </p>
        <div className="flex items-center gap-2">
          <RiskLevelBadge level={message.riskLevel} />
          <ConfidenceIndicator confidence={message.confidence} />
        </div>
      </div>

      {onOpenThread ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-7 px-2 text-xs"
          onClick={onOpenThread}
        >
          View full thread
        </Button>
      ) : null}
    </article>
  );
}
