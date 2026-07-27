import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AgentMessageCard } from "./AgentMessageCard";
import { AgentConsensusCard } from "./AgentConsensusCard";
import { CallTimeline } from "./CallTimeline";
import { BookmarkThreadButton } from "./FollowBookmarkButtons";
import { CopyContractButton } from "./CopyContractButton";
import type { AgentMessage, ConsensusSummary, FeedThread } from "@/lib/feed/types";

const statusLabel: Record<FeedThread["status"], string> = {
  monitoring: "Monitoring",
  setup_forming: "Setup Forming",
  trade_active: "Trade Active",
  risk_escalated: "Risk Escalated",
  invalidated: "Invalidated",
  target_reached: "Target Reached",
  closed: "Closed",
  insufficient_data: "Insufficient Data",
};

export function ThreadView({
  thread,
  messages,
  consensus,
  onOpenChange,
}: {
  thread: FeedThread | null;
  messages: AgentMessage[];
  consensus: ConsensusSummary | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!thread) return null;
  const threadMessages = thread.messageIds
    .map((id) => messages.find((m) => m.id === id))
    .filter((m): m is AgentMessage => Boolean(m))
    .reverse();

  return (
    <Dialog open={Boolean(thread)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{thread.token.symbol} thread</DialogTitle>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
              {statusLabel[thread.status]}
            </span>
            <BookmarkThreadButton threadId={thread.id} symbol={thread.token.symbol} />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">{thread.token.name}</span>
            <CopyContractButton address={thread.token.address} />
          </div>
        </DialogHeader>

        <CallTimeline timeline={thread.timeline} />

        {consensus ? <AgentConsensusCard consensus={consensus} /> : null}

        <div className="space-y-3">
          {threadMessages.map((message) => (
            <AgentMessageCard key={message.id} message={message} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
