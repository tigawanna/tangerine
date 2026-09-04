import { createTimeline, onScroll } from "animejs";
import { useEffect, useRef } from "react";

const WORD_START = "var(--color-landing-word-start)";
const WORD_END = "var(--color-landing-sage)";

type ScrollHighlightProseProps = {
  title: string;
  text: string;
};

export function ScrollHighlightProse({ title, text }: ScrollHighlightProseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const words = text.split(/\s+/).filter(Boolean);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const wordEls = section.querySelectorAll<HTMLElement>("[data-scroll-word]");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wordEls.forEach((word) => {
        word.style.color = WORD_END;
      });
      return;
    }

    const timeline = createTimeline({
      autoplay: onScroll({
        target: section,
        enter: "top top",
        leave: "bottom bottom",
        sync: true,
      }),
    });

    const step = words.length > 1 ? 100 / (words.length - 1) : 0;

    wordEls.forEach((word, index) => {
      timeline.add(
        word,
        {
          color: [WORD_START, WORD_END],
          duration: step,
          ease: "linear",
        },
        index * step,
      );
    });

    return () => {
      timeline.revert();
    };
  }, [words.length, text]);

  return (
    <section
      ref={sectionRef}
      data-test="scroll-highlight-prose"
      className="landing-void-surface relative"
      style={{ height: "180vh" }}
    >
      <div className="landing-void-glow-center pointer-events-none absolute inset-0" />

      <div className="sticky top-0 flex h-screen flex-col items-center justify-center px-6 lg:px-12">
        <h2 className="mb-10 font-serif text-3xl font-medium tracking-[-0.03em] text-landing-sage/55 sm:mb-12 sm:text-4xl lg:text-5xl">
          {title}
        </h2>

        <p className="mx-auto max-w-4xl text-center font-serif text-2xl leading-[1.6] font-light sm:max-w-5xl sm:text-3xl sm:leading-[1.65] lg:text-4xl lg:leading-[1.6] xl:text-5xl xl:leading-[1.55]">
          {words.map((word, index) => (
            <span key={`${word}-${index}`} data-scroll-word style={{ color: WORD_START }}>
              {word}{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
