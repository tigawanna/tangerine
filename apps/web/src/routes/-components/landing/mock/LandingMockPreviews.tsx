import { cn } from "@/lib/utils";
import { AppBrandIcon } from "@/components/icon/AppBrandIcon";
import { CircleUser, ListFilterPlus, Search, Sparkles, Star, Trash2, UserPlus, Zap } from "lucide-react";
import {
  landingMockBulkRepos,
  landingMockPeople,
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
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="border-base-300 bg-base-200 text-base-content/70 rounded-full border px-2.5 py-1 text-[10px] font-medium">
          Pushed recently
        </span>
        <span className="border-base-300 bg-base-200 text-base-content/70 rounded-full border px-2.5 py-1 text-[10px] font-medium">
          Sources
        </span>
        <span className="bg-primary/15 text-primary rounded-full px-2.5 py-1 text-[10px] font-semibold">
          TypeScript
        </span>
      </div>
      <LandingMockRepoCard repo={repo} />
    </div>
  );
}

/** Starred list preview with quick filters. */
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="bg-primary/15 text-primary rounded-full px-2.5 py-1 text-[10px] font-semibold">
            Newest
          </span>
          <span className="border-base-300 bg-base-200 text-base-content/70 rounded-full border px-2.5 py-1 text-[10px] font-medium">
            Most starred
          </span>
          <span className="border-base-300 bg-base-200 text-base-content/70 rounded-full border px-2.5 py-1 text-[10px] font-medium">
            Not mine
          </span>
        </div>
        <span className="text-base-content/40 inline-flex items-center gap-1 text-[10px]">
          <Star className="size-3 fill-current" />
          3 filters
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
        Local RAG over your stars · soon
      </p>
    </div>
  );
}

const mockQueryTokens = [
  { label: "language", value: "TypeScript" },
  { label: "stars", value: ">1000" },
  { label: "user", value: "johndoe" },
] as const;

/** Ergonomic search bar + visual GitHub query editor preview. */
export function LandingMockGithubSearchPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-base-100 text-base-content pointer-events-none select-none overflow-hidden rounded-xl p-3",
        className,
      )}
      data-test="landing-mock-github-search-preview"
      aria-hidden
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="border-base-300 bg-base-200/70 flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border px-3">
          <Search className="text-base-content/40 size-3.5 shrink-0" />
          <span className="text-base-content/55 min-w-0 flex-1 truncate font-mono text-xs">
            language:TypeScript stars:&gt;1000 user:johndoe
          </span>
          <span className="border-base-300 text-base-content/40 hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline">
            ⌘K
          </span>
        </div>
        <div className="border-base-300 bg-base-200/50 text-base-content/70 flex h-10 shrink-0 items-center rounded-xl border px-3 text-xs">
          Repositories
        </div>
        <div className="bg-primary text-primary-content flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-medium">
          <ListFilterPlus className="size-3.5" />
          Filters
          <span className="bg-primary-content/20 rounded px-1.5 py-0.5 text-[10px]">3</span>
        </div>
      </div>

      <div className="border-base-300 bg-base-200/40 mt-3 rounded-xl border p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-base-content/45 text-[10px] font-semibold tracking-wide uppercase">
            Query editor
          </p>
          <span className="text-base-content/40 text-[10px]">Live preview</span>
        </div>
        <code className="text-primary mt-2 block font-mono text-[11px] break-all">
          language:TypeScript stars:&gt;1000 user:johndoe
        </code>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {mockQueryTokens.map((token) => (
            <li
              key={token.label}
              className="border-base-300 bg-base-100 text-base-content/70 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
            >
              <span className="text-base-content/40">{token.label}:</span>
              {token.value}
            </li>
          ))}
        </ul>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="border-base-300/80 space-y-1 rounded-lg border px-2.5 py-2">
            <p className="text-base-content/40 text-[10px] uppercase">Language</p>
            <p className="text-xs font-medium">TypeScript</p>
          </div>
          <div className="border-base-300/80 space-y-1 rounded-lg border px-2.5 py-2">
            <p className="text-base-content/40 text-[10px] uppercase">Stars</p>
            <p className="text-xs font-medium">&gt; 1000</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Follow-graph hopping: followers → their projects → their followers. */
export function LandingMockGraphPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-base-100 text-base-content pointer-events-none select-none overflow-hidden rounded-xl p-3",
        className,
      )}
      data-test="landing-mock-graph-preview"
      aria-hidden
    >
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="bg-primary/15 text-primary rounded-full px-2.5 py-1 font-semibold">
          Followers
        </span>
        <span className="text-base-content/35">→</span>
        <span className="border-base-300 bg-base-200 text-base-content/70 rounded-full border px-2.5 py-1 font-medium">
          Their repos
        </span>
        <span className="text-base-content/35">→</span>
        <span className="border-base-300 bg-base-200 text-base-content/70 rounded-full border px-2.5 py-1 font-medium">
          Their followers
        </span>
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-base-content/45 text-[10px] font-semibold tracking-wide uppercase">
          Keep following the thread
        </p>
        <span className="text-base-content/40 text-[10px]">3 hops deep</span>
      </div>

      <ul className="space-y-2">
        {landingMockPeople.slice(0, 3).map((person) => (
          <li
            key={person.id}
            className="border-base-300 bg-base-200/60 flex items-center gap-3 rounded-lg border px-2.5 py-2"
          >
            <img
              src={person.avatarUrl}
              alt=""
              className="border-base-300 size-9 shrink-0 rounded-full border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{person.name}</p>
              <p className="text-base-content/50 truncate text-[11px]">@{person.login}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                person.action === "Follow back"
                  ? "bg-primary/15 text-primary"
                  : "border-base-300 text-base-content/55 border",
              )}
            >
              {person.action === "Follow back" ? "Open" : "View"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Bulk follow-back: one button for everyone who followed you overnight. */
export function LandingMockBulkFollowBackPreview({ className }: { className?: string }) {
  const followBackCount = landingMockPeople.filter((person) => person.action === "Follow back").length;

  return (
    <div
      className={cn(
        "bg-base-100 text-base-content pointer-events-none select-none overflow-hidden rounded-xl p-3",
        className,
      )}
      data-test="landing-mock-bulk-follow-back-preview"
      aria-hidden
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="border-base-300 bg-base-200/70 text-base-content/45 flex h-9 min-w-0 flex-1 items-center rounded-lg border px-3 text-xs">
          Filter by name or login…
        </div>
        <span className="border-base-300 bg-base-200 text-base-content inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold">
          <UserPlus className="size-3.5" />
          Follow back all ({followBackCount})
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {landingMockPeople.map((person) => (
          <li
            key={person.id}
            className="border-base-300 bg-base-200/60 flex flex-col gap-2 rounded-xl border p-3"
          >
            <div className="flex items-start gap-2.5">
              <img
                src={person.avatarUrl}
                alt=""
                className="border-base-300 size-10 shrink-0 rounded-full border object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{person.name}</p>
                <p className="text-base-content/50 truncate text-[11px]">@{person.login}</p>
                <p className="text-base-content/55 mt-1 line-clamp-2 text-[11px] leading-4">
                  {person.bio}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex w-full items-center justify-center rounded-lg px-2.5 py-1.5 text-[11px] font-semibold",
                person.action === "Follow back"
                  ? "bg-primary text-primary-content"
                  : "border-base-300 text-base-content/60 border",
              )}
            >
              {person.action}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Bulk repo deletion preview — select many, wipe in one pass. */
export function LandingMockBulkDeletePreview({ className }: { className?: string }) {
  const selectedCount = landingMockBulkRepos.filter((repo) => repo.selected).length;

  return (
    <div
      className={cn(
        "bg-base-100 text-base-content pointer-events-none select-none overflow-hidden rounded-xl p-3",
        className,
      )}
      data-test="landing-mock-bulk-delete-preview"
      aria-hidden
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-base-content/55 text-[10px] font-semibold tracking-wide uppercase">
          Bulk edit
        </span>
        <span className="bg-error/15 text-error inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold">
          <Trash2 className="size-3" />
          Delete {selectedCount} repos
        </span>
      </div>

      <ul className="space-y-2">
        {landingMockBulkRepos.map((repo) => (
          <li
            key={repo.id}
            className={cn(
              "border-base-300 flex items-center gap-3 rounded-lg border px-2.5 py-2",
              repo.selected ? "bg-error/10 ring-error/40 ring-1" : "bg-base-200/50",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded border text-[10px]",
                repo.selected
                  ? "border-error bg-error text-error-content"
                  : "border-base-300 bg-base-100",
              )}
            >
              {repo.selected ? "✓" : null}
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-xs">{repo.name}</span>
            {repo.selected ? (
              <span className="text-error/70 text-[10px] font-medium">Selected</span>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="text-base-content/45 mt-3 text-center text-[11px] leading-5">
        Dozens gone in the time GitHub asks you to confirm one. Use with caution 🙂
      </p>
    </div>
  );
}
