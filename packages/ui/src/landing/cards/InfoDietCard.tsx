import type { InfoDietSource } from "../config/info";
import { useLandingCardMotion } from "../hooks/use-landing-card-motion";
import { ArrowUpRight, Mic, Newspaper } from "lucide-react";
import { useRef } from "react";
import { twMerge } from "tailwind-merge";

interface InfoDietCardProps {
  source: InfoDietSource;
  className?: string;
}

const kindActionLabels = {
  podcast: "Listen",
  blog: "Read",
} as const;

export function InfoDietCard({ source, className }: InfoDietCardProps) {
  const cardRef = useRef<HTMLAnchorElement | null>(null);
  useLandingCardMotion(cardRef);

  const Icon = source.kind === "podcast" ? Mic : Newspaper;

  return (
    <a
      ref={cardRef}
      href={source.href}
      target="_blank"
      rel="noopener noreferrer"
      data-test={`infodiet-card-${source.id}`}
      className={twMerge(
        "landing-card group relative flex h-full flex-col gap-4 border-landing-cream/10 bg-landing-panel p-6 transition-colors",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-landing-cream/12 bg-landing-cream/6 text-landing-sage transition-colors group-hover:border-landing-cream/22 group-hover:text-landing-cream">
          <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <span className="rounded-full border border-landing-cream/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-landing-olive uppercase">
          {source.kind === "podcast" ? "Podcast" : "Blog"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <h3 className="font-serif text-2xl leading-tight tracking-[-0.02em] text-landing-cream">
          {source.name}
        </h3>
        <p className="text-sm leading-6 text-landing-sage/80">{source.description}</p>
      </div>

      <span className="inline-flex items-center gap-1 text-xs font-medium tracking-[0.12em] text-landing-sage uppercase transition-colors group-hover:text-landing-cream">
        {kindActionLabels[source.kind]}
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </span>
    </a>
  );
}
