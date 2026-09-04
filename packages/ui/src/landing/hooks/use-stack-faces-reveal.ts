import { observeLayoutResize, subscribeScroll } from "../utils/landing-scroll";
import { useEffect, type RefObject } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const circleOrigin = "50% 50%";
const minCircleRadius = 7;
const maxCircleRadius = 108;

export function useStackFacesReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-face-panel]"));
    const contents = panels.map((p) => p.querySelector<HTMLElement>("[data-face-content]"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      panels.forEach((p) => p.style.removeProperty("clip-path"));
      contents.forEach((c) => {
        if (c) {
          c.style.opacity = "1";
          c.style.transform = "none";
        }
      });
      return;
    }

    let tops: number[] = [];
    let vh = window.innerHeight;
    let frame = 0;

    const measure = () => {
      vh = window.innerHeight;
      const rootTop = root.getBoundingClientRect().top + window.scrollY;
      tops = panels.map((_, index) => rootTop + index * vh);
    };

    const update = (scroll: number) => {
      frame = 0;

      panels.forEach((panel, index) => {
        if (index === 0) return;

        const panelTop = tops[index];
        if (panelTop == null) return;
        const isLast = index === panels.length - 1;
        const enterScroll = panelTop - vh * (isLast ? 0.38 : 0.32);
        const leaveScroll = panelTop + vh * (isLast ? 0.42 : 0.78);
        const range = leaveScroll - enterScroll;
        const raw = range > 0 ? (scroll - enterScroll) / range : 0;
        const circleProgress = clamp(raw, 0, 1);
        const radius = minCircleRadius + circleProgress * maxCircleRadius;
        panel.style.clipPath = `circle(${radius}% at ${circleOrigin})`;

        const content = contents[index];
        if (content) {
          const contentStart = isLast ? 0.38 : 0.48;
          const contentRaw =
            range > 0
              ? (scroll - (enterScroll + range * contentStart)) / (range * (1 - contentStart))
              : 0;
          const contentProgress = clamp(contentRaw, 0, 1);
          const ease = 1 - Math.pow(1 - contentProgress, 3);
          content.style.opacity = String(ease);
          content.style.transform = `scale(${0.88 + 0.12 * ease})`;
        }

        if (isLast && scroll >= leaveScroll) {
          panel.style.clipPath = `circle(${maxCircleRadius}% at ${circleOrigin})`;
          if (content) {
            content.style.opacity = "1";
            content.style.transform = "scale(1)";
          }
        }
      });
    };

    const onScroll = (scrollY: number) => {
      if (!frame) frame = requestAnimationFrame(() => update(scrollY));
    };

    const onResize = () => {
      measure();
      update(window.scrollY);
    };

    measure();
    update(window.scrollY);

    const unsubscribeScroll = subscribeScroll(onScroll);
    const unobserveResize = observeLayoutResize(root, onResize);
    window.addEventListener("resize", onResize);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      unsubscribeScroll();
      unobserveResize();
      window.removeEventListener("resize", onResize);
    };
  }, [ref]);
}
