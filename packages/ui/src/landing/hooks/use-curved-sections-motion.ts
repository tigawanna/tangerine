import { observeLayoutResize, subscribeScroll } from "../utils/landing-scroll";
import { useEffect, type RefObject } from "react";

type CurvedTarget = {
  inner: HTMLElement | null;
  content: HTMLElement | null;
  number: HTMLElement | null;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function isPanelActive(panel: HTMLElement) {
  const rect = panel.getBoundingClientRect();
  return rect.top <= 2 && rect.bottom >= window.innerHeight * 0.45;
}

export function useCurvedSectionsMotion(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-curved-section]"));
    const targets: CurvedTarget[] = panels.map((panel) => ({
      inner: panel.querySelector<HTMLElement>("[data-curved-inner]"),
      content: panel.querySelector<HTMLElement>("[data-curved-content]"),
      number: panel.querySelector<HTMLElement>("[data-curved-number]"),
    }));

    let tops: number[] = [];
    let panelHeight = window.innerHeight;
    let frame = 0;

    const measure = () => {
      panelHeight = panels[0]?.offsetHeight || window.innerHeight;
      const rootTop = root.getBoundingClientRect().top + window.scrollY;
      tops = panels.map((_, index) => rootTop + index * panelHeight);
    };

    const update = (scroll: number) => {
      frame = 0;

      targets.forEach((target, index) => {
        const panel = panels[index];
        if (!panel) return;

        const panelTop = tops[index];
        if (panelTop == null) return;
        const progress = (scroll - panelTop) / panelHeight;
        const rise = clamp(progress + 1, 0, 1);
        const cover = index < targets.length - 1 ? clamp(progress, 0, 1) : 0;
        const active = isPanelActive(panel);

        if (target.content) {
          let reveal = clamp(rise / 0.6, 0, 1);
          if (active) reveal = Math.max(reveal, 0.98);
          target.content.style.opacity = String(reveal);
          target.content.style.transform = `translateY(${(1 - reveal) * 56}px)`;
        }

        if (target.number) {
          const parallax = clamp(progress, -1, 1);
          const translate = 12 - (parallax + 1) * 17;
          target.number.style.transform = `translateY(${translate}%)`;
        }

        if (target.inner) {
          const fade = active ? 0 : cover * 0.8;
          target.inner.style.opacity = String(1 - fade);
          target.inner.style.transform = `translateY(${-52 * cover}px) scale(${1 - 0.07 * cover})`;
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

      for (const target of targets) {
        target.content?.style.removeProperty("opacity");
        target.content?.style.removeProperty("transform");
        target.number?.style.removeProperty("transform");
        target.inner?.style.removeProperty("opacity");
        target.inner?.style.removeProperty("transform");
      }
    };
  }, [ref]);
}
