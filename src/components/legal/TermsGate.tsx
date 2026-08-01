import { useEffect, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useTermsAcceptance } from "@/hooks/useTermsAcceptance";
import { TermsModal } from "./TermsModal";

/**
 * Routes that must stay reachable even before acceptance — otherwise a
 * visitor clicking "Terms & Conditions" to actually go read it would land on
 * a page that's itself gated, a dead end. These open in a new tab from the
 * modal, so the original tab's gate is untouched either way.
 */
const EXEMPT_PATHS = ["/terms", "/privacy", "/app/disclaimer"];

/**
 * Mounted once at the root (see __root.tsx) so every current and future
 * route inherits it automatically — nothing else needs to opt in. While the
 * gate is up, the rest of the page is made `inert`, which blocks focus and
 * pointer interaction and removes it from the accessibility tree in one
 * step (real keyboard-proof blocking, not just pointer-events-none).
 */
export function TermsGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { hasAccepted, accept } = useTermsAcceptance();
  const isExempt = EXEMPT_PATHS.includes(pathname);
  const showGate = !hasAccepted && !isExempt;

  useEffect(() => {
    if (!showGate) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showGate]);

  return (
    <>
      <div inert={showGate ? true : undefined} aria-hidden={showGate || undefined}>
        {children}
      </div>
      {showGate ? <TermsModal onAccept={accept} /> : null}
    </>
  );
}
