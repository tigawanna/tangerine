import { cn } from "@/lib/utils";
import { AppBrandIcon } from "@/components/icon/AppBrandIcon";
import { CircleUser, Search, Sparkles, Star, Zap } from "lucide-react";
import {
  landingMockRepos,
  landingMockStarredRepos,
} from "./data";
import { LandingMockRepoCard } from "./LandingMockRepoCard";
import { LandingMockUserHeader } from "./LandingMockUserHeader";

const profileTabs = ["repos", "starred", "followers", "following"] as const;

/**
 * Full product preview for the hero — profile header + tabs + repo grid.
 * Pointer-events disabled so it stays decorative inside the browser chrome.
 */
export function LandingMockProfilePreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-base-100 text-base-content pointer-events-none select-none",
        className,
      )}
      data-test="landing-mock-profile-preview"
      aria-hidden
    >
      <div className="flex">
        <aside className="border-base-300 bg-base-200/40 hidden w-14 shrink-0 flex-col items-center gap-3 border-r py-4 sm:flex md:w-16">
          <AppBrandIcon size={28} className="opacity-90" />
          <span className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-lg">
            <CircleUser className="size-4" />
          </span>
          <span className="bg-base-300/60 text-base-content/40 mt-auto flex size-8 items-center justify-center rounded-full text-[10px] font-semibold">
            JD
          </span>
        </aside>

        <div className="min-w-0 flex-1 space-y-3 overflow-hidden p-3 sm:p-4 md:space-y-4 md:p-5">
          <LandingMockUserHeader dense />

          <div>
            <div className="border-base-300 mb-3 grid grid-cols-4 gap-0 border-b">
              {profileTabs.map((tab, index) => (
                <div
                  key={tab}
                  className={cn(
                    "px-1 py-2 text-center text-xs capitalize sm:text-sm",
                    index === 0
                      ? "border-primary text-base-content border-b-2 font-medium"
                      : "text-base-content/45",
                  )}
                >
                  {tab}
                </div>
              ))}
            </div>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {landingMockRepos.map((repo) => (
                <li key={repo.id} className="min-w-0">
                  <LandingMockRepoCard repo={repo} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Single repo card for the Repositories feature tile. */
export function LandingMockReposPreview({ className }: { className?: string }) {
  const repo = landingMockRepos[0];

  return (
    <div
      className={cn(
        "bg-base-100 text-base-content pointer-events-none select-none overflow-hidden rounded-xl p-3",
        className,
      )}
      data-test="landing-mock-repos-preview"
      aria-hidden
    >
      <LandingMockRepoCard repo={repo} />
    </div>
  );
}

/** Starred list preview — own work vs starred neighbors. */
export function LandingMockStarsPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-base-100 text-base-content pointer-events-none select-none overflow-hidden rounded-xl p-3",
        className,
      )}
      data-test="landing-mock-stars-preview"
      aria-hidden
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-base-content/55 text-[10px] font-semibold tracking-wide uppercase">
          Starred
        </p>
        <span className="text-base-content/40 inline-flex items-center gap-1 text-[10px]">
          <Star className="size-3 fill-current" />
          Newest
        </span>
      </div>
      <ul className="space-y-2">
        {landingMockStarredRepos.map((repo) => (
          <li
            key={repo.id}
            className="border-base-300 bg-base-200/60 flex items-center gap-3 rounded-lg border px-2.5 py-2"
          >
            <div
              className="size-9 shrink-0 rounded-md"
              style={{ background: repo.cover }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {repo.ownerLogin}/<span className="text-primary">{repo.name}</span>
              </p>
              <p className="text-base-content/50 truncate text-[11px]">{repo.description}</p>
            </div>
            <span className="text-base-content/45 inline-flex shrink-0 items-center gap-1 text-[11px]">
              <Star className="size-3" />
              {repo.stargazerCount.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** SPA navigation preview — preload + no full-page reloads. */
export function LandingMockSpeedPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-base-100 text-base-content pointer-events-none select-none overflow-hidden rounded-xl",
        className,
      )}
      data-test="landing-mock-speed-preview"
      aria-hidden
    >
      <div className="flex min-h-35">
        <aside className="border-base-300 bg-base-200/50 flex w-12 shrink-0 flex-col items-center gap-2 border-r py-3">
          <AppBrandIcon size={22} />
          <Zap className="text-primary size-4" />
          <span className="bg-base-300/70 mt-auto size-6 rounded-full" />
        </aside>
        <div className="min-w-0 flex-1 space-y-2 p-3">
          <div className="flex items-center gap-2">
            <span className="bg-primary/15 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
              <Zap className="size-3" />
              Relay preload
            </span>
            <span className="text-base-content/40 text-[10px]">No full reload</span>
          </div>
          <LandingMockUserHeader compact />
          <div className="grid grid-cols-3 gap-1.5">
            {landingMockRepos.map((repo) => (
              <div
                key={repo.id}
                className="border-base-300 bg-base-200 h-12 rounded-md border"
                style={{ backgroundImage: repo.cover, backgroundSize: "cover" }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Coming-soon local RAG search over starred repos. */
export function LandingMockSearchPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-base-100 text-base-content pointer-events-none select-none overflow-hidden rounded-xl p-3",
        className,
      )}
      data-test="landing-mock-search-preview"
      aria-hidden
    >
      <div className="border-base-300 bg-base-200/70 flex items-center gap-2 rounded-lg border px-3 py-2">
        <Search className="text-base-content/40 size-3.5 shrink-0" />
        <span className="text-base-content/55 flex-1 truncate text-xs">
          that rust editor I starred last year…
        </span>
        <Sparkles className="text-primary size-3.5 shrink-0" />
      </div>
      <ul className="mt-2 space-y-1.5">
        {landingMockStarredRepos.map((repo, index) => (
          <li
            key={repo.id}
            className="border-base-300/80 bg-base-200/40 flex items-center justify-between rounded-md border px-2.5 py-1.5"
          >
            <span className="truncate font-mono text-[11px]">
              {repo.ownerLogin}/{repo.name}
            </span>
            <span className="text-base-content/40 text-[10px]">{92 - index * 7}% match</span>
          </li>
        ))}
      </ul>
      <p className="text-base-content/40 mt-2 text-center text-[10px] tracking-wide uppercase">
        Local RAG over your stars — soon
      </p>
    </div>
  );
}
