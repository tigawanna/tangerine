type ScrollListener = (scrollY: number) => void;

const listeners = new Set<ScrollListener>();

function emit(scrollY: number) {
  for (const listener of listeners) {
    listener(scrollY);
  }
}

export function subscribeScroll(listener: ScrollListener) {
  listeners.add(listener);
  listener(window.scrollY);

  const onNativeScroll = () => {
    emit(window.scrollY);
  };

  window.addEventListener("scroll", onNativeScroll, { passive: true });

  return () => {
    listeners.delete(listener);
    window.removeEventListener("scroll", onNativeScroll);
  };
}

export function observeLayoutResize(target: Element | null, onResize: () => void) {
  if (!target || typeof ResizeObserver === "undefined") return () => {};

  const observer = new ResizeObserver(onResize);
  observer.observe(target);

  return () => {
    observer.disconnect();
  };
}
