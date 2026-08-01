import { useCallback, useEffect, useState } from "react";

/**
 * Bumping this key forces every visitor to re-accept (e.g. after a material
 * change to the Terms & Conditions), without needing any other code change.
 */
const STORAGE_KEY = "robinpulse_terms_accepted_v1";

/**
 * localStorage-backed one-time acceptance flag for the sitewide Terms gate.
 * Starts `false` on both server and client render (localStorage doesn't
 * exist during SSR) and corrects itself in an effect after mount — the same
 * pattern WalletConnectButton.tsx uses for its own client-only state, so
 * there's no hydration mismatch and no flash of unblocked content for
 * first-time visitors.
 */
export function useTermsAcceptance(): { hasAccepted: boolean; accept: () => void } {
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    try {
      setHasAccepted(window.localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      // Storage unavailable (e.g. private browsing) — gate stays up for this session.
    }
  }, []);

  const accept = useCallback(() => {
    setHasAccepted(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Best-effort persistence — acceptance still holds for the current session via state.
    }
  }, []);

  return { hasAccepted, accept };
}
