import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { OrganicDivider } from "../primitives";

type EditorialTone = "panel" | "panelAlt";

const toneClasses = {
  panel: "bg-landing-panel text-landing-sage",
  panelAlt: "bg-landing-panel-alt text-landing-sage",
} satisfies Record<EditorialTone, string>;

type EditorialMobileSectionProps = {
  title: string;
  tone: EditorialTone;
  showDivider?: boolean;
  children: ReactNode;
  className?: string;
  dataTest?: string;
};

export function EditorialMobileSection({
  title,
  tone,
  showDivider = false,
  children,
  className,
  dataTest,
}: EditorialMobileSectionProps) {
  return (
    <article
      data-test={dataTest}
      className={twMerge(
        "relative px-6 py-16 sm:px-10 sm:py-24 lg:px-16 lg:py-32",
        toneClasses[tone],
        className,
      )}
    >
      {showDivider ? <OrganicDivider tone={tone} /> : null}

      <div className="landing-void-glow-soft pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <h3 className="mb-10 text-center font-serif text-4xl leading-[0.95] font-medium tracking-[-0.04em] text-landing-sage/80 sm:mb-12 sm:text-5xl lg:mb-14 lg:text-6xl">
          {title}
        </h3>

        {children}
      </div>
    </article>
  );
}

export function editorialToneForIndex(index: number): EditorialTone {
  return index % 2 === 0 ? "panel" : "panelAlt";
}
