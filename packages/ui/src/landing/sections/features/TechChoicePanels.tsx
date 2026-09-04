import type { TechChoice } from "../../types/tech-choices";
import { CheckCircle2, MoveRight } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function TechChoiceDetailPanel({
  choice,
  index,
  className,
}: {
  choice: TechChoice;
  index: number;
  className?: string;
}) {
  return (
    <article className={className}>
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs tracking-[0.32em] text-primary/80 uppercase">{choice.category}</p>
          <h3 className="mt-3 font-serif text-4xl leading-none font-medium tracking-[-0.035em] text-landing-cream xl:text-5xl">
            {choice.name}
          </h3>
        </div>
        <span className="grid size-14 shrink-0 place-items-center rounded-full border border-landing-cream/12 bg-landing-cream/7 font-serif text-xl text-landing-cream/72">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <p className="mt-5 text-base leading-7 text-landing-cream/86">{choice.summary}</p>
      <p className="mt-3 text-sm leading-6 text-landing-sage/72">{choice.reason}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {choice.strengths.map((strength) => (
          <span
            key={strength}
            className="inline-flex items-center gap-2 rounded-full border border-landing-cream/12 bg-landing-cream/7 px-3.5 py-2 text-xs text-landing-cream/82"
          >
            <CheckCircle2 className="size-3.5 text-primary/80" />
            {strength}
          </span>
        ))}
      </div>
    </article>
  );
}

export function TechChoiceRailItem({
  choice,
  index,
  isActive,
  onSelect,
}: {
  choice: TechChoice;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`tech-choice-tab-${choice.id}`}
      aria-controls="tech-choice-detail-panel"
      data-test={`tech-choice-rail-${choice.id}`}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={() => onSelect(index)}
      className={twMerge(
        "group relative w-full text-left transition-[transform,opacity] duration-500 ease-out",
        isActive ? "z-10 -translate-x-3 opacity-100" : "translate-x-0 opacity-40 hover:opacity-65",
      )}
    >
      <div
        className={twMerge(
          "flex items-center justify-between gap-4 rounded-none border bg-landing-panel-alt/72 px-5 py-3 shadow-lg shadow-black/16 transition-[border-color,background-color] duration-500",
          isActive
            ? "border-primary/50 bg-landing-cream/10"
            : "border-landing-cream/10 group-hover:border-landing-cream/20",
        )}
      >
        <div className="flex items-center gap-4">
          <span
            className={twMerge(
              "font-serif text-xl leading-none transition-colors duration-500",
              isActive ? "text-primary" : "text-landing-cream/35",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="font-serif text-xl leading-none tracking-tight text-landing-cream">
              {choice.name}
            </p>
            <p className="mt-1 text-xs text-landing-sage/58">{choice.position}</p>
          </div>
        </div>
        <MoveRight
          className={twMerge(
            "size-4 transition-colors duration-500",
            isActive ? "text-primary" : "text-landing-cream/22",
          )}
        />
      </div>
    </button>
  );
}
