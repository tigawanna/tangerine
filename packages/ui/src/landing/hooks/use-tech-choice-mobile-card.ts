import { animate } from "animejs";
import { useEffect, useRef, type RefObject } from "react";

const SWIPE_THRESHOLD_PX = 64;
const SWIPE_COMMIT_RATIO = 0.18;
const ENTER_DURATION = 300;
const EXIT_DURATION = 220;
const SNAP_DURATION = 180;

type DragState = {
  active: boolean;
  startX: number;
  startY: number;
  dx: number;
  axis: "x" | "y" | null;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useTechChoiceMobileCard(
  cardRef: RefObject<HTMLElement | null>,
  activeIndex: number,
  direction: 1 | -1,
  count: number,
  selectIndex: (index: number) => void,
) {
  const dragRef = useRef<DragState>({
    active: false,
    startX: 0,
    startY: 0,
    dx: 0,
    axis: null,
  });
  const animatingRef = useRef(false);
  const skipEnterRef = useRef(true);
  const activeIndexRef = useRef(activeIndex);

  activeIndexRef.current = activeIndex;

  const goToIndex = (target: number, fromDx = 0) => {
    const card = cardRef.current;
    if (
      !card ||
      animatingRef.current ||
      target < 0 ||
      target >= count ||
      target === activeIndexRef.current
    ) {
      return;
    }

    const travelDirection = target > activeIndexRef.current ? 1 : -1;

    if (prefersReducedMotion()) {
      selectIndex(target);
      return;
    }

    animatingRef.current = true;
    card.style.transform = "";

    animate(card, {
      translateX: [`${fromDx}px`, travelDirection > 0 ? "-108%" : "108%"],
      rotateZ: [fromDx * 0.035, travelDirection * -7],
      opacity: [1, 0.35],
      duration: EXIT_DURATION,
      ease: "inQuart",
      onComplete: () => {
        selectIndex(target);
        animatingRef.current = false;
      },
    });
  };

  const goToIndexRef = useRef(goToIndex);
  goToIndexRef.current = goToIndex;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    if (skipEnterRef.current) {
      skipEnterRef.current = false;
      return;
    }

    if (prefersReducedMotion()) {
      card.style.transform = "none";
      card.style.opacity = "1";
      return;
    }

    animatingRef.current = true;
    const enterFrom = direction > 0 ? "108%" : "-108%";

    const anim = animate(card, {
      translateX: [enterFrom, "0%"],
      rotateZ: [direction * 7, 0],
      opacity: [0.35, 1],
      duration: ENTER_DURATION,
      ease: "outQuart",
      onComplete: () => {
        animatingRef.current = false;
      },
    });

    return () => {
      anim.revert();
    };
  }, [cardRef, activeIndex, direction]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || count < 2) return;

    const resetDrag = () => {
      dragRef.current = { active: false, startX: 0, startY: 0, dx: 0, axis: null };
    };

    const onPointerDown = (event: PointerEvent) => {
      if (animatingRef.current) return;
      if ((event.target as HTMLElement).closest("[data-tech-choice-nav]")) return;

      dragRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        dx: 0,
        axis: null,
      };
      card.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current.active || animatingRef.current) return;

      const dx = event.clientX - dragRef.current.startX;
      const dy = event.clientY - dragRef.current.startY;

      if (!dragRef.current.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        dragRef.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }

      if (dragRef.current.axis !== "x") return;

      event.preventDefault();
      dragRef.current.dx = dx;

      const index = activeIndexRef.current;
      const atStart = index === 0 && dx > 0;
      const atEnd = index === count - 1 && dx < 0;
      const resistedDx = atStart || atEnd ? dx * 0.35 : dx;

      card.style.transform = `translateX(${resistedDx}px) rotateZ(${resistedDx * 0.035}deg)`;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragRef.current.active) return;

      if (card.hasPointerCapture(event.pointerId)) {
        card.releasePointerCapture(event.pointerId);
      }

      const axis = dragRef.current.axis;
      const dx = dragRef.current.dx;
      const index = activeIndexRef.current;
      resetDrag();

      if (axis !== "x") {
        card.style.transform = "";
        return;
      }

      const width = card.offsetWidth;
      const goNext =
        index < count - 1 && (dx < -SWIPE_THRESHOLD_PX || dx < -width * SWIPE_COMMIT_RATIO);
      const goPrev = index > 0 && (dx > SWIPE_THRESHOLD_PX || dx > width * SWIPE_COMMIT_RATIO);

      if (goNext) {
        goToIndexRef.current(index + 1, dx);
        return;
      }

      if (goPrev) {
        goToIndexRef.current(index - 1, dx);
        return;
      }

      if (prefersReducedMotion()) {
        card.style.transform = "";
        return;
      }

      animate(card, {
        translateX: [dx, 0],
        rotateZ: [dx * 0.035, 0],
        duration: SNAP_DURATION,
        ease: "outQuart",
      });
    };

    card.addEventListener("pointerdown", onPointerDown);
    card.addEventListener("pointermove", onPointerMove);
    card.addEventListener("pointerup", onPointerUp);
    card.addEventListener("pointercancel", onPointerUp);

    return () => {
      card.removeEventListener("pointerdown", onPointerDown);
      card.removeEventListener("pointermove", onPointerMove);
      card.removeEventListener("pointerup", onPointerUp);
      card.removeEventListener("pointercancel", onPointerUp);
    };
  }, [cardRef, count]);

  return { goToIndex };
}
