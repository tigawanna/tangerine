import { techChoices } from "../../config/info";
import { useTechChoiceMobileCard } from "../../hooks/use-tech-choice-mobile-card";
import { useTechChoicePanel } from "../../hooks/use-tech-choice-panel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { ScrollReveal, SectionEyebrow } from "../../primitives";
import { TechChoiceDetailPanel } from "./TechChoicePanels";

export function TechChoicesMobile() {
  const { activeIndex, direction, selectIndex } = useTechChoicePanel(techChoices.length, {
    enableWheelNav: false,
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const { goToIndex } = useTechChoiceMobileCard(
    cardRef,
    activeIndex,
    direction,
    techChoices.length,
    selectIndex,
  );

  const activeChoice = techChoices[activeIndex];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === techChoices.length - 1;

  if (!activeChoice) return null;

  return (
    <div data-test="tech-choices-mobile" className="lg:hidden">
      <div className="relative z-10 py-20">
        <div className="px-4 sm:px-6">
          <ScrollReveal className="max-w-xl">
            <SectionEyebrow>Why I choose what I choose</SectionEyebrow>
            <h2 className="landing-section-heading">Ten tools, one reasoned stack at a time.</h2>
          </ScrollReveal>
        </div>

        <div className="mt-10 w-full">
          <div
            ref={cardRef}
            data-test="tech-choice-card-mobile"
            className="relative w-full touch-pan-y overflow-hidden rounded-none border border-landing-cream/12 bg-landing-panel/82 px-12 py-6 pb-14 shadow-xl shadow-black/20 will-change-transform"
          >
            <TechChoiceDetailPanel choice={activeChoice} index={activeIndex} />

            <button
              type="button"
              data-tech-choice-nav
              data-test="tech-choice-prev"
              aria-label="Previous tool"
              disabled={isFirst}
              onClick={() => goToIndex(activeIndex - 1)}
              className="btn btn-ghost btn-circle absolute top-1/2 left-2 z-20 size-10 min-h-10 -translate-y-1/2 border border-landing-cream/12 bg-landing-panel/90 backdrop-blur-sm disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="size-5" />
            </button>

            <button
              type="button"
              data-tech-choice-nav
              data-test="tech-choice-next"
              aria-label="Next tool"
              disabled={isLast}
              onClick={() => goToIndex(activeIndex + 1)}
              className="btn btn-ghost btn-circle absolute top-1/2 right-2 z-20 size-10 min-h-10 -translate-y-1/2 border border-landing-cream/12 bg-landing-panel/90 backdrop-blur-sm disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="size-5" />
            </button>

            <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs tracking-[0.22em] text-landing-sage/70 uppercase">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(techChoices.length).padStart(2, "0")}
            </p>
          </div>

          <p className="mt-4 px-4 text-center text-[10px] tracking-[0.24em] text-landing-sage/65 uppercase sm:px-6">
            Swipe the card
          </p>
        </div>
      </div>
    </div>
  );
}
