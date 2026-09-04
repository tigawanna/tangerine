/** Fixed navbar height (`h-20`) used to offset in-page hash targets. */
export const LANDING_NAVBAR_OFFSET_PX = 80;

const DEFAULT_LAYOUT_SETTLE_MS = 3_000;
const ELEMENT_POLL_MS = 50;

type ScrollToLandingHashOptions = {
  behavior?: ScrollBehavior;
  /** How long to keep correcting scroll when deferred sections resize. */
  layoutSettleMs?: number;
};

/**
 * Scrolls to a landing-page section id, retrying until the target exists and
 * briefly correcting for layout shifts from below-the-fold hydration.
 */
export function scrollToLandingHashWhenReady(
  hash: string,
  {
    behavior = "instant",
    layoutSettleMs = DEFAULT_LAYOUT_SETTLE_MS,
  }: ScrollToLandingHashOptions = {},
): () => void {
  const id = hash.replace(/^#/, "");
  if (!id) {
    return () => {};
  }

  let cancelled = false;
  let pollTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let settleTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let resizeObserver: ResizeObserver | undefined;

  const getTargetScrollTop = (element: HTMLElement) => {
    return element.getBoundingClientRect().top + window.scrollY - LANDING_NAVBAR_OFFSET_PX;
  };

  const scrollToTarget = () => {
    const element = document.getElementById(id);
    if (!element) {
      return false;
    }

    window.scrollTo({
      top: getTargetScrollTop(element),
      behavior,
    });
    return true;
  };

  const isAlignedWithTarget = () => {
    const element = document.getElementById(id);
    if (!element) {
      return true;
    }

    const targetTop = getTargetScrollTop(element);
    return Math.abs(window.scrollY - targetTop) <= 4;
  };

  const cleanup = () => {
    cancelled = true;
    resizeObserver?.disconnect();
    if (pollTimeoutId) {
      clearTimeout(pollTimeoutId);
    }
    if (settleTimeoutId) {
      clearTimeout(settleTimeoutId);
    }
  };

  const watchLayout = () => {
    const main = document.getElementById("main-content");
    if (!main || typeof ResizeObserver === "undefined") {
      return;
    }

    resizeObserver = new ResizeObserver(() => {
      if (cancelled || isAlignedWithTarget()) {
        return;
      }

      scrollToTarget();
    });
    resizeObserver.observe(main);

    settleTimeoutId = setTimeout(() => {
      cleanup();
    }, layoutSettleMs);
  };

  const waitForTarget = () => {
    if (cancelled) {
      return;
    }

    if (scrollToTarget()) {
      watchLayout();
      return;
    }

    pollTimeoutId = setTimeout(waitForTarget, ELEMENT_POLL_MS);
  };

  waitForTarget();

  return cleanup;
}

let cancelActiveLandingScroll: (() => void) | undefined;

/**
 * Smoothly scrolls to a landing section for in-page nav clicks.
 *
 * Cancels any scroll still in flight (e.g. rapid clicks) before starting a new
 * one, and drives the scroll from JS so it bypasses the browser's native anchor
 * jump. This avoids TanStack Router's scroll restoration overriding the target
 * on the first click, and keeps correcting for below-the-fold hydration shifts.
 *
 * @param hash - Target section hash, with or without a leading "#".
 */
export function smoothScrollToLandingHash(hash: string) {
  cancelActiveLandingScroll?.();
  cancelActiveLandingScroll = scrollToLandingHashWhenReady(hash, { behavior: "smooth" });
}

/**
 * Smoothly scrolls to the landing hero (page top). Used by the brand mark when
 * already on the landing route — a plain `/` Link is a no-op mid-page.
 */
export function smoothScrollToLandingTop() {
  cancelActiveLandingScroll?.();
  cancelActiveLandingScroll = undefined;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Smoothly scrolls to the document bottom (footer / end of page).
 */
export function smoothScrollToLandingBottom() {
  cancelActiveLandingScroll?.();
  cancelActiveLandingScroll = undefined;
  const top = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  window.scrollTo({ top, behavior: "smooth" });
}
