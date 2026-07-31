import type { LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";

export interface TokenUtilityItem {
  icon: LucideIcon;
  label: string;
}

export function TokenUtilityGrid({
  eyebrow,
  title,
  items,
  id,
}: {
  eyebrow: string;
  title: string;
  items: TokenUtilityItem[];
  id?: string;
}) {
  return (
    <section id={id} className="mt-16">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.label} className="card-surface flex items-center gap-3 p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-foreground">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
