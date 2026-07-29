import { ShieldAlert } from "lucide-react";

const SAFETY_POINTS = [
  "Recruitment is not currently live.",
  "Farming parameters are subject to final deployment configuration.",
  "Never trust unofficial contract addresses.",
  "Verify all future links through official RobinPulse channels.",
  "Digital assets involve risk.",
  "Agent ownership does not guarantee profit or token value.",
];

export function PreTgeNotice() {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
          <ShieldAlert className="size-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Pre-TGE Farming Notice</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Genesis Agents accumulate future $PULSE allocation before TGE. $PULSE is not currently
            claimable or transferable through Agent Hub. Final contract addresses, claim mechanics,
            token details, and distribution procedures will be announced through official RobinPulse
            channels.
          </p>
        </div>
      </div>
      <ul className="mt-4 grid gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground sm:grid-cols-2">
        {SAFETY_POINTS.map((point) => (
          <li key={point} className="flex gap-2">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
