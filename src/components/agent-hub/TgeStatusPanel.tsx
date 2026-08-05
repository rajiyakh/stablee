import { Lock } from "lucide-react";
import { tgeConfig, TGE_NOT_ANNOUNCED_MESSAGE } from "@/config/tge";
import { SectionHeading } from "@/components/common/SectionHeading";

const STATUS_LABEL: Record<typeof tgeConfig.status, string> = {
  "not-announced": "Not Announced",
  scheduled: "Scheduled",
  "farming-active": "Farming Active",
  "tge-complete": "TGE Complete",
  "claim-live": "Claim Live",
  "distribution-pending": "Distribution Pending",
  "distribution-complete": "Distribution Complete",
};

const DISTRIBUTION_LABEL: Record<typeof tgeConfig.distributionMode, string> = {
  "contract-claim": "Claim contract",
  "manual-distribution": "Manual distribution",
  "not-decided": "Not yet decided",
};

export function TgeStatusPanel() {
  return (
    <section>
      <SectionHeading eyebrow="Token Generation Event" title="TGE and claim status" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            TGE status
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {STATUS_LABEL[tgeConfig.status]}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Launch date
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {tgeConfig.date || TGE_NOT_ANNOUNCED_MESSAGE}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Distribution method
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-lg font-semibold text-foreground">
            {!tgeConfig.claimEnabled ? <Lock className="size-4 text-muted-foreground" /> : null}
            {DISTRIBUTION_LABEL[tgeConfig.distributionMode]}
          </p>
        </div>
      </div>
    </section>
  );
}
