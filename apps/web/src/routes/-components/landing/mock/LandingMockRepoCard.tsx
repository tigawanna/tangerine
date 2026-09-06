import { cn } from "@/lib/utils";
import { Copy, Lock, Star } from "lucide-react";
import type { LandingMockRepo } from "./data";

/**
 * Decorative repo card for landing previews — mirrors dashboard `RepoCard`
 * layout without Relay, routing, or selection chrome.
 */
export function LandingMockRepoCard({
  repo,
  className,
  compact = false,
}: {
  repo: LandingMockRepo;
  className?: string;
  compact?: boolean;
}) {
  return (
    <article
      className={cn(
        "border-base-300 bg-base-200 flex h-full flex-col overflow-hidden rounded-xl border",
        className,
      )}
      data-test={`landing-mock-repo-${repo.name}`}
    >
      <div
        className={cn("relative overflow-hidden", compact ? "aspect-21/9" : "aspect-video")}
        style={{ background: repo.cover }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-linear-to-t from-black/35 to-transparent" />
        <span className="absolute right-2 bottom-2 font-mono text-[10px] font-medium tracking-wide text-white/80 uppercase">
          {repo.name}
        </span>
      </div>

      <div className={cn("flex flex-1 flex-col gap-2", compact ? "p-3" : "gap-3 p-4 pt-3")}>
        <div className="min-w-0 space-y-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">{repo.name}</p>
            {repo.isPrivate ? (
              <Lock className="text-base-content/40 mt-0.5 size-3.5 shrink-0" aria-hidden />
            ) : null}
            {repo.isFork ? (
              <span className="bg-base-300 text-base-content/60 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                Fork
              </span>
            ) : null}
          </div>
          <p className="text-base-content/45 truncate text-xs">@{repo.ownerLogin}</p>
          {compact ? null : (
            <p className="text-base-content/65 line-clamp-2 min-h-10 text-sm leading-5">
              {repo.description}
            </p>
          )}
        </div>

        {repo.languages.length > 0 ? (
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {repo.languages.map((lang) => (
              <li
                key={lang.id}
                className="text-base-content/55 inline-flex items-center gap-1.5 text-xs"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: lang.color }}
                  aria-hidden
                />
                {lang.name}
              </li>
            ))}
          </ul>
        ) : null}

        {compact ? null : (
          <div className="border-base-300/80 text-base-content/45 mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs">
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5" aria-hidden />
              {repo.stargazerCount.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Copy className="size-3.5" aria-hidden />
              {repo.forkCount.toLocaleString()}
            </span>
            <span className="truncate font-mono text-[11px]">{repo.branch}</span>
            <span className="ml-auto truncate">{repo.pushedLabel}</span>
          </div>
        )}
      </div>
    </article>
  );
}
