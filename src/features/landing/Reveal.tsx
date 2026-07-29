import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "./useInView";

/** Wraps content in a scroll-triggered fade-up. See useInView for the observer logic. */
export function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const { ref, isInView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(!isInView && "opacity-0", isInView && "fade-up-in", className)}
      style={isInView && delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
