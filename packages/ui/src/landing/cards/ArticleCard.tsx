import { useLandingCardMotion } from "../hooks/use-landing-card-motion";
import type { DevtoArticle } from "../types/devto";
import { ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { twMerge } from "tailwind-merge";

interface ArticleCardProps {
  article: DevtoArticle;
  className?: string;
}

export function ArticleCard({ article, className }: ArticleCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  useLandingCardMotion(cardRef);

  const imageUrl = article.social_image || article.cover_image;

  return (
    <article
      ref={cardRef}
      data-test="article-card"
      className={twMerge("landing-card group relative flex flex-col overflow-hidden", className)}
    >
      <div className="landing-card-media relative h-48 shrink-0 overflow-hidden">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={article.title}
              className="landing-card-media-image h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-landing-panel via-landing-panel/20 to-transparent" />
          </>
        ) : (
          <div className="h-full bg-linear-to-br from-landing-gradient-from to-landing-gradient-to" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6 pt-4">
        <h3 className="line-clamp-2 font-serif text-xl leading-snug text-landing-cream">
          {article.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-6 text-landing-sage/80">{article.description}</p>

        {article.tag_list.length > 0 ? (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {article.tag_list.slice(0, 4).map((tag) => (
              <li key={tag} className="landing-card-tag">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-landing-cream/8 pt-4 text-sm">
          <span className="text-xs text-landing-sage/50">
            {article.readable_publish_date}
            {article.reading_time_minutes > 0 ? ` · ${article.reading_time_minutes} min` : null}
          </span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-6 items-center gap-1 text-xs font-medium text-landing-sage transition-colors hover:text-landing-cream"
          >
            <span className="sr-only">{article.title}: </span>
            Read article
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
