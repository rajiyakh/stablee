import { AlertTriangle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { RiskFlags } from "@/components/market/RiskFlags";
import { AgentAvatar } from "./AgentAvatar";
import { CopyContractButton } from "./CopyContractButton";
import { getAgent } from "@/lib/agents";
import { relativeTime } from "@/lib/market/format";
import type { AgentMessage } from "@/lib/feed/types";

export function RiskAlertCard({ message }: { message: AgentMessage }) {
  const agent = getAgent(message.agentSlug);
  if (!agent || message.riskFlags.length === 0) return null;

  return (
    <article className="rounded-xl border border-negative/30 bg-negative/5 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <AgentAvatar agent={agent} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-negative" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">Risk alert · {agent.name}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Link
              to="/token/$chainId/$address"
              params={{ chainId: message.token.chainId, address: message.token.address }}
              className="text-xs font-semibold text-foreground hover:underline"
            >
              {message.token.symbol}
            </Link>
            <CopyContractButton address={message.token.address} />
            <span className="text-[11px] text-muted-foreground">
              {relativeTime(message.createdAt)}
            </span>
          </div>
          <RiskFlags flags={message.riskFlags} className="mt-2" />
          <p className="mt-2 text-sm leading-relaxed text-foreground">{message.content}</p>
        </div>
      </div>
    </article>
  );
}
