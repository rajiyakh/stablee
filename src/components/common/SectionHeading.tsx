import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  backgroundImage,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Public path to a background photo (e.g. "/backgrounds/portfolio-hero.webp") — opt-in
   *  only. Renders a dark hero band with the image + scrim instead of the plain heading. */
  backgroundImage?: string;
}) {
  if (backgroundImage) {
    return (
      <div
        className={cn(
          "relative flex flex-wrap items-end justify-between gap-4 overflow-hidden rounded-2xl border border-border/50 px-6 py-10 sm:px-10 sm:py-14",
          className,
        )}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25"
          aria-hidden="true"
        />
        <div className="relative max-w-2xl">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-white/80">{description}</p>
          ) : null}
        </div>
        {action ? <div className="relative shrink-0">{action}</div> : null}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
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
