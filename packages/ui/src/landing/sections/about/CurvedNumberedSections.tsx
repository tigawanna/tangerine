import { useCurvedSectionsMotion } from "../../hooks/use-curved-sections-motion";
import type { CurvedNumberedSectionsProps } from "../../types/curved-sections";
import { useRef } from "react";
import { twMerge } from "tailwind-merge";

export function CurvedNumberedSections({
  sections,
  className,
  dataTest = "curved-numbered-sections",
}: CurvedNumberedSectionsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useCurvedSectionsMotion(rootRef);

  return (
    <div ref={rootRef} data-test={dataTest} className={twMerge("relative w-full", className)}>
      {sections.map((section, index) => {
        const number = index + 1;
        const isFirst = index === 0;
        const isLast = index === sections.length - 1;

        return (
          <div
            key={section.id}
            data-curved-section
            data-test={`curved-section-${number}`}
            className={
              isLast
                ? "relative flex w-full py-20 md:py-28"
                : "sticky top-0 flex h-svh w-full items-center"
            }
            style={{
              zIndex: index + 1,
              backgroundColor: section.background,
              color: section.foreground,
              borderTopLeftRadius: isFirst ? undefined : "50% 7vw",
              borderTopRightRadius: isFirst ? undefined : "50% 7vw",
            }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <span
                className="absolute bottom-[-6vw] right-[-2vw] font-serif text-[42vw] leading-none font-semibold opacity-[0.07] select-none sm:text-[34vw] lg:text-[26vw]"
                aria-hidden="true"
              >
                {number}
              </span>
            </div>

            <div
              data-curved-inner
              className={
                isLast
                  ? "relative mx-auto flex w-full max-w-7xl items-start justify-between gap-8 px-6 sm:px-10 lg:px-16"
                  : "relative mx-auto flex w-full max-w-7xl items-end justify-between gap-8 px-6 will-change-transform sm:px-10 lg:items-center lg:px-16"
              }
            >
              <div data-curved-content className="relative z-10 max-w-2xl lg:max-w-3xl">
                <p className="mb-4 font-sans text-xs font-medium tracking-[0.4em] uppercase text-inherit/80 sm:mb-5">
                  {section.eyebrow ?? `Step ${number}`}
                </p>
                <h3 className="font-serif text-4xl font-medium tracking-[-0.03em] sm:text-5xl lg:text-6xl xl:text-7xl">
                  {section.label}
                </h3>
                {section.body ? (
                  <p className="mt-5 max-w-xl font-sans text-base leading-relaxed text-inherit/85 sm:mt-6 sm:text-lg lg:text-xl">
                    {section.body}
                  </p>
                ) : null}
              </div>

              <span
                data-curved-number
                className="shrink-0 self-start font-serif text-[20vw] leading-none font-semibold opacity-90 will-change-transform sm:text-[15vw] lg:self-center lg:text-[11vw]"
              >
                {number}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
