import { ArrowDown, ArrowRight, Coins, Rocket, Sprout, Wallet } from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";

const STEPS = [
  {
    icon: Rocket,
    title: "Mint an Agent",
    description: "Acquire a Genesis Agent after minting opens.",
  },
  {
    icon: Sprout,
    title: "Farming Begins",
    description:
      "The Agent starts accumulating future $ORCA allocation from its activation timestamp.",
  },
  {
    icon: Coins,
    title: "Allocation Grows",
    description: "Each Agent accumulates according to its configured daily farming rate.",
  },
  {
    icon: Wallet,
    title: "Claim After TGE",
    description:
      "Accumulated allocation becomes claimable only after the official Token Generation Event and claim activation.",
  },
];

export function HowFarmingWorks() {
  return (
    <section>
      <SectionHeading eyebrow="Farming" title="How farming works" />
      <div className="mt-8 flex flex-col gap-0 sm:hidden">
        {STEPS.map((step, i) => (
          <div key={step.title}>
            <StepCard step={step} index={i} />
            {i < STEPS.length - 1 ? (
              <div className="flex justify-center py-2">
                <ArrowDown className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-8 hidden items-stretch gap-3 sm:flex">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex min-w-0 flex-1 items-stretch gap-3">
            <StepCard step={step} index={i} className="min-w-0 flex-1" />
            {i < STEPS.length - 1 ? (
              <div className="flex items-center">
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
  className,
}: {
  step: (typeof STEPS)[number];
  index: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card backdrop-blur-md p-5 ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <step.icon className="size-4" aria-hidden="true" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Step {index + 1}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{step.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
    </div>
  );
}
