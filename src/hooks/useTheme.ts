import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "robinpulse_theme";
const THEME_CHANGE_EVENT = "robinpulse:theme-change";

export type Theme = "light" | "dark";

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Best-effort persistence — theme still applies for the current session.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/**
 * Reads/writes the sitewide light/dark theme, kept in sync with the
 * `data-theme` attribute the no-flash inline script in __root.tsx sets
 * before hydration. Starts `"light"` on both server and client render (same
 * SSR-safety pattern as useTermsAcceptance) and corrects itself in an effect
 * after mount. A custom window event — not React state/context — keeps every
 * mounted consumer in sync: DexChartEmbed can sit several components below
 * SiteHeader's toggle in the tree, so an event beats prop drilling.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readTheme());
    const onChange = () => setTheme(readTheme());
    window.addEventListener(THEME_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(readTheme() === "dark" ? "light" : "dark");
  }, []);

  return { theme, toggleTheme };
}
