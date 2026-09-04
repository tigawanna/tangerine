import { animate } from "animejs";
import { useEffect, type RefObject } from "react";

export function useLandingCardMotion(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const card = ref.current;
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let animation: ReturnType<typeof animate> | undefined;

    const setGlowPosition = (event: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--landing-card-glow-x", `${x}%`);
      card.style.setProperty("--landing-card-glow-y", `${y}%`);
    };

    const lift = () => {
      card.dataset.motion = "active";
      animation?.revert();
      animation = animate(card, {
        translateY: -8,
        scale: 1.012,
        duration: 320,
        ease: "outQuart",
      });
    };

    const settle = () => {
      delete card.dataset.motion;
      animation?.revert();
      animation = animate(card, {
        translateY: 0,
        scale: 1,
        duration: 520,
        ease: "outQuart",
      });
    };

    const handleFocus = () => {
      card.style.setProperty("--landing-card-glow-x", "50%");
      card.style.setProperty("--landing-card-glow-y", "24%");
      lift();
    };

    card.addEventListener("pointerenter", lift);
    card.addEventListener("pointermove", setGlowPosition);
    card.addEventListener("pointerleave", settle);
    card.addEventListener("focusin", handleFocus);
    card.addEventListener("focusout", settle);

    return () => {
      card.removeEventListener("pointerenter", lift);
      card.removeEventListener("pointermove", setGlowPosition);
      card.removeEventListener("pointerleave", settle);
      card.removeEventListener("focusin", handleFocus);
      card.removeEventListener("focusout", settle);
      animation?.revert();
    };
  }, [ref]);
}
