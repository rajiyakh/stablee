import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Every /app/* page sits over the site-wide background photo
        // (see AppShell.tsx), which is position:fixed — so this heading can
        // land on the photo's busiest region on any page, not just some.
        // The scrim is inert wherever it isn't needed (e.g. deep in a page
        // that has scrolled past the busy region, or nested inside a card
        // that already has its own opaque/blurred background).
        "flex flex-wrap items-end justify-between gap-4 rounded-xl bg-background/60 px-4 py-3 backdrop-blur-sm",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
