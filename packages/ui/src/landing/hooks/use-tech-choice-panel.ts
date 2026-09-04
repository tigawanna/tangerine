import { useEffect, useRef, useState } from "react";

export function useTechChoicePanel(count: number, options: { enableWheelNav?: boolean } = {}) {
  const { enableWheelNav = true } = options;
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [visitedIndices, setVisitedIndices] = useState(() => new Set<number>([0]));
  const detailRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(activeIndex);

  activeIndexRef.current = activeIndex;

  const selectIndex = (index: number) => {
    const current = activeIndexRef.current;
    if (index < 0 || index >= count || index === current) return;
    setDirection(index > current ? 1 : -1);
    setActiveIndex(index);
  };

  const goNext = () => selectIndex(activeIndexRef.current + 1);
  const goPrev = () => selectIndex(activeIndexRef.current - 1);

  const selectIndexRef = useRef(selectIndex);
  selectIndexRef.current = selectIndex;

  useEffect(() => {
    if (count < 1) return;
    setActiveIndex((index) => Math.max(0, Math.min(index, count - 1)));
  }, [count]);

  useEffect(() => {
    setVisitedIndices((visited) => {
      if (visited.has(activeIndex)) return visited;
      const next = new Set(visited);
      next.add(activeIndex);
      return next;
    });
  }, [activeIndex]);

  const allVisited = visitedIndices.size >= count;
  const visitedCount = visitedIndices.size;

  useEffect(() => {
    detailRef.current?.scrollTo({ top: 0 });
  }, [activeIndex]);

  useEffect(() => {
    if (!enableWheelNav) return;
    const el = detailRef.current;
    if (!el || count < 2) return;

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY <= 0) return;

      const fitsWithoutScroll = el.scrollHeight <= el.clientHeight + 2;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      const index = activeIndexRef.current;

      if (event.deltaY > 0 && (fitsWithoutScroll || atBottom) && index < count - 1) {
        event.preventDefault();
        event.stopPropagation();
        selectIndexRef.current(index + 1);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [count, enableWheelNav]);

  return {
    activeIndex,
    direction,
    selectIndex,
    goNext,
    goPrev,
    detailRef,
    allVisited,
    visitedCount,
  };
}
