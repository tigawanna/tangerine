import { flushSync } from "react-dom";

export const THEME_VIEW_TRANSITION_TYPE = "theme";

/**
 * Run a theme change inside a same-document view transition.
 * Uses the `theme` transition type so route morphs (e.g. search) keep their own root animation.
 */
export function withThemeViewTransition(apply: () => void): void {
  if (typeof document === "undefined") {
    apply();
    return;
  }

  if (
    !("startViewTransition" in document) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    apply();
    return;
  }

  try {
    document.startViewTransition({
      update: () => {
        flushSync(apply);
      },
      types: [THEME_VIEW_TRANSITION_TYPE],
    });
  } catch {
    apply();
  }
}
