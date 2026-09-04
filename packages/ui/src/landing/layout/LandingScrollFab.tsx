import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { twMerge } from "tailwind-merge";
import { subscribeScroll } from "../utils/landing-scroll";
import {
  smoothScrollToLandingBottom,
  smoothScrollToLandingTop,
} from "../utils/scroll-to-landing-hash";

/** Scroll past this fraction of the viewport before the control appears. */
const SHOW_VIEWPORT_RATIO = 0.4;
/** Extra scroll (as a viewport fraction) over which the pair fully splits. */
const SPLIT_VIEWPORT_RATIO = 0.5;
/** Center-to-center travel of each blob at full split (px). */
const MAX_SEPARATION_PX = 26;
/** Split amount at which the bottom target becomes interactive. */
const SPLIT_INTERACTIVE_AT = 0.35;
/** Hide the FAB after this long with no scroll on hover-capable devices (ms). */
const IDLE_HIDE_MS = 5000;

/**
 * True when the primary pointer can't hover — touch phones/tablets.
 * Idle-hide is a desktop pattern (hover keeps the FAB up); on touch it
 * just makes the control disappear before you can tap it.
 */
function isTouchPrimaryDevice() {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

const glassSurfaceClass = twMerge(
  "rounded-full border border-landing-cream/30 bg-landing-cream/20",
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_8px_28px_rgb(0_0_0/0.22)]",
  "backdrop-blur-xl backdrop-saturate-150",
);

const glassIconClass = twMerge(
  "absolute flex size-11 items-center justify-center rounded-full",
  "text-landing-cream transition-[transform,opacity,color,background-color,border-color]",
  "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
  "hover:border-landing-cream/45 hover:bg-landing-cream/28 hover:text-landing-cream-highlight",
  "active:scale-[0.96]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-cream",
  glassSurfaceClass,
);

type FabVisualState = {
  visible: boolean;
  /** 0 = fused blob, 1 = fully separated pair. */
  split: number;
  nearBottom: boolean;
};

/**
 * Reads scroll position into appear / split / near-bottom flags for the FAB.
 */
function readFabVisualState(scrollY: number): FabVisualState {
  const viewport = window.innerHeight;
  const showAt = viewport * SHOW_VIEWPORT_RATIO;
  const fullSplitAt = showAt + viewport * SPLIT_VIEWPORT_RATIO;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewport);
  const split =
    fullSplitAt <= showAt
      ? 1
      : Math.min(1, Math.max(0, (scrollY - showAt) / (fullSplitAt - showAt)));

  return {
    visible: scrollY > showAt,
    split,
    nearBottom: maxScroll > 0 && scrollY >= maxScroll - 48,
  };
}

/**
 * Fixed bottom-right scroll control: a fused gooey blob that mitosis-splits into
 * “top” and “bottom” targets as you keep scrolling. Appears while scrolling past
 * the threshold, then auto-hides after idle (stays up while hovered). The rubbery
 * neck comes from an SVG goo filter as the circles drift apart.
 *
 * Mount via `LandingScrollFabDeferred` so this stays client-only and lazy.
 */
export function LandingScrollFab() {
  const filterId = `landing-scroll-goo-${useId().replace(/:/g, "")}`;
  const [pastThreshold, setPastThreshold] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);
  const [nearBottom, setNearBottom] = useState(false);
  const [split, setSplit] = useState(0);
  const [touchPrimary, setTouchPrimary] = useState(false);
  const nearBottomRef = useRef(false);
  const pastThresholdRef = useRef(false);
  const splitRef = useRef(0);
  const idleTimerRef = useRef<number | null>(null);
  const pointerInsideRef = useRef(false);
  const skipInitialScrollRef = useRef(true);
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  /**
   * Keeps the FAB visible briefly after scroll; clears when idle unless the pointer is over it.
   * No-op on touch — those devices keep the FAB up while past the scroll threshold.
   */
  const scheduleIdleHide = () => {
    if (typeof window !== "undefined" && isTouchPrimaryDevice()) return;
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (pointerInsideRef.current) return;
    idleTimerRef.current = window.setTimeout(() => {
      idleTimerRef.current = null;
      setScrollActive(false);
    }, IDLE_HIDE_MS);
  };

  useEffect(() => {
    const touchMedia = window.matchMedia("(hover: none), (pointer: coarse)");
    const syncTouch = () => setTouchPrimary(touchMedia.matches);
    syncTouch();
    touchMedia.addEventListener("change", syncTouch);
    return () => touchMedia.removeEventListener("change", syncTouch);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeScroll((scrollY) => {
      const state = readFabVisualState(scrollY);
      const nextSplit = state.visible ? (prefersReducedMotion.current ? 1 : state.split) : 0;
      const touch = isTouchPrimaryDevice();

      if (state.nearBottom !== nearBottomRef.current) {
        nearBottomRef.current = state.nearBottom;
        setNearBottom(state.nearBottom);
      }

      if (state.visible !== pastThresholdRef.current) {
        pastThresholdRef.current = state.visible;
        setPastThreshold(state.visible);
      }

      if (Math.abs(nextSplit - splitRef.current) > 0.004) {
        splitRef.current = nextSplit;
        setSplit(nextSplit);
      } else if (nextSplit !== splitRef.current && (nextSplit === 0 || nextSplit === 1)) {
        splitRef.current = nextSplit;
        setSplit(nextSplit);
      }

      // subscribeScroll fires once on subscribe — ignore that so we only appear on real scroll.
      if (skipInitialScrollRef.current) {
        skipInitialScrollRef.current = false;
        if (touch && state.visible) {
          setScrollActive(true);
        }
        return;
      }

      if (!state.visible) {
        setScrollActive(false);
        if (idleTimerRef.current !== null) {
          window.clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }
        return;
      }

      setScrollActive(true);
      scheduleIdleHide();
    });

    return () => {
      unsubscribe();
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  // Touch: stay up while scrolled past the threshold. Desktop: pulse on scroll, idle-hide.
  const visible = pastThreshold && (touchPrimary || scrollActive);
  const splitReady = split > SPLIT_INTERACTIVE_AT;
  const showDown = splitReady && !nearBottom;
  const visualSplit = nearBottom ? 0 : split;
  const travel = `${visualSplit * MAX_SEPARATION_PX}px`;
  const downOpacity = nearBottom ? 0 : Math.min(1, Math.max(0, (split - 0.18) / 0.32));

  const travelStyle = {
    ["--fab-travel" as string]: travel,
  } satisfies CSSProperties;

  return (
    <div
      data-test="landing-scroll-fab"
      data-visible={visible ? "true" : "false"}
      data-split-ready={splitReady ? "true" : "false"}
      onPointerEnter={() => {
        pointerInsideRef.current = true;
        if (idleTimerRef.current !== null) {
          window.clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }
        if (pastThresholdRef.current) setScrollActive(true);
      }}
      onPointerLeave={() => {
        pointerInsideRef.current = false;
        if (pastThresholdRef.current && scrollActive) scheduleIdleHide();
      }}
      className={twMerge(
        "fixed right-4 bottom-20 z-40 origin-bottom md:right-7 md:bottom-24",
        "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible
          ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-3 scale-75 opacity-0",
      )}
    >
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 20 -9
              "
            />
          </filter>
        </defs>
      </svg>

      <div className="relative flex h-36 w-14 items-center justify-center" style={travelStyle}>
        {/* Goo mass stays slightly more opaque so the SVG filter can still form a neck. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-10 flex items-center justify-center"
          style={prefersReducedMotion.current ? undefined : { filter: `url(#${filterId})` }}
        >
          <span
            className={twMerge(
              "absolute size-11 rounded-full bg-landing-cream/35",
              "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              "motion-reduce:transition-none",
              "-translate-y-[var(--fab-travel)]",
            )}
          />
          <span
            className={twMerge(
              "absolute size-11 rounded-full bg-landing-cream/35",
              "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              "motion-reduce:transition-none",
              "translate-y-[var(--fab-travel)]",
            )}
            style={{ opacity: nearBottom ? 0 : 1 }}
          />
        </div>

        <button
          type="button"
          data-test="landing-scroll-fab-up"
          aria-label="Scroll to top"
          className={twMerge(glassIconClass, "-translate-y-[var(--fab-travel)]")}
          onClick={smoothScrollToLandingTop}
        >
          <ArrowUp className="size-[18px] stroke-[2.25]" aria-hidden="true" />
        </button>

        <button
          type="button"
          data-test="landing-scroll-fab-down"
          aria-label="Scroll to bottom"
          aria-hidden={!showDown}
          aria-disabled={!showDown}
          disabled={!showDown}
          tabIndex={showDown ? 0 : -1}
          className={twMerge(
            glassIconClass,
            "translate-y-[var(--fab-travel)]",
            "disabled:cursor-default",
          )}
          style={{
            opacity: downOpacity,
            pointerEvents: showDown ? "auto" : "none",
          }}
          onClick={smoothScrollToLandingBottom}
        >
          <ArrowDown className="size-[18px] stroke-[2.25]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
