import { AlertTriangle } from "lucide-react";
import type { SupportedChain } from "@/lib/bridge/types";

/**
 * Surfaces a provider's own chain-risk annotation verbatim when present
 * (e.g. LI.FI flags Robinhood Chain "Unverified (flagged by hypernative)")
 * — never suppressed, never invented.
 */
export function BridgeRiskNotice({
  fromChain,
  toChain,
}: {
  fromChain: SupportedChain | null;
  toChain: SupportedChain | null;
}) {
  const notes = [fromChain?.riskNote, toChain?.riskNote].filter((n): n is string => Boolean(n));
  if (notes.length === 0) return null;

  return (
    <div className="flex items-start gap-1.5 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <div className="space-y-0.5">
        {notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>
    </div>
  );
}
