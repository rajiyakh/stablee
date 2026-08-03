import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/features/landing/Reveal";

export function SectionShell({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8", className)}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Reveal>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </Reveal>
  );
}

export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("glass-panel p-5", className)}>{children}</div>;
}
