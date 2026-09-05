import { Checkbox } from "@/components/ui/checkbox";
import type { GithubRepoNode } from "@/types/github";
import { getRelativeTimeString } from "@/utils/date-helpers";
import { Link } from "@tanstack/react-router";
import { graphql, useFragment } from "react-relay";
import { Copy, Github, Lock, Star } from "lucide-react";
import { VscVscodeInsiders } from "react-icons/vsc";
import type { RepoCard_repository$key } from "./__generated__/RepoCard_repository.graphql";

interface RepoCardProps {
  /** Relay fragment key — preferred for dashboard lists. */
  repository?: RepoCard_repository$key | null;
  /** Plain node from React Query lists (detail pages, legacy). */
  repo?: GithubRepoNode | null;
  /** Bulk-edit mode: show selection checkbox when `canSelect`. */
  editing?: boolean;
  selected?: boolean;
  canSelect?: boolean;
  onToggleSelect?: () => void;
}

type RepoCardView = {
  id: string;
  name: string;
  nameWithOwner: string;
  description: string | null;
  pushedAt: string | null;
  diskUsage: number | null;
  url: string;
  isPrivate: boolean;
  isFork: boolean;
  stargazerCount: number;
  forkCount: number;
  openGraphImageUrl: string | null;
  ownerLogin: string;
  branch: string | null;
  languages: Array<{ id: string; name: string; color: string | null }>;
};

/**
 * Formats GitHub `diskUsage` (kilobytes) for display on repo cards.
 */
function formatDiskUsage(kilobytes: number | null | undefined): string | null {
  if (kilobytes == null || kilobytes <= 0) return null;
  if (kilobytes < 1024) return `${kilobytes} KB`;
  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function fromGithubNode(repo: GithubRepoNode): RepoCardView {
  const languages =
    repo.languages?.nodes?.filter((lang): lang is NonNullable<typeof lang> => lang != null).slice(0, 3) ??
    [];
  const primary = repo.primaryLanguage;
  return {
    id: repo.nameWithOwner,
    name: repo.name,
    nameWithOwner: repo.nameWithOwner,
    description: repo.description,
    pushedAt: repo.pushedAt,
    diskUsage: repo.diskUsage,
    url: repo.url,
    isPrivate: repo.isPrivate,
    isFork: repo.isFork,
    stargazerCount: repo.stargazerCount,
    forkCount: repo.forkCount,
    openGraphImageUrl: repo.openGraphImageUrl,
    ownerLogin: repo.owner?.login ?? repo.nameWithOwner.split("/")[0] ?? "",
    branch: repo.defaultBranchRef?.name ?? null,
    languages:
      languages.length > 0
        ? languages.map((lang) => ({
            id: lang.id,
            name: lang.name,
            color: lang.color,
          }))
        : primary
          ? [{ id: primary.id, name: primary.name, color: primary.color }]
          : [],
  };
}

type RepoCardSelection = {
  editing?: boolean;
  selected?: boolean;
  canSelect?: boolean;
  onToggleSelect?: () => void;
};

/**
 * Modern repository card. Primary navigation goes to in-app repo details;
 * GitHub / VS Code stay as explicit external actions.
 */
export function RepoCard({
  repository,
  repo,
  editing,
  selected,
  canSelect,
  onToggleSelect,
}: RepoCardProps) {
  const selection = { editing, selected, canSelect, onToggleSelect } satisfies RepoCardSelection;

  if (repository != null) {
    return <RelayRepoCard repository={repository} selection={selection} />;
  }
  if (repo != null) {
    return <RepoCardSurface view={fromGithubNode(repo)} selection={selection} />;
  }
  return null;
}

function RelayRepoCard({
  repository,
  selection,
}: {
  repository: RepoCard_repository$key;
  selection: RepoCardSelection;
}) {
  const fragData = useFragment(RepoCardFragment, repository);
  const view: RepoCardView = {
    id: fragData.id,
    name: fragData.name,
    nameWithOwner: fragData.nameWithOwner,
    description: fragData.description ?? null,
    pushedAt: fragData.pushedAt ?? null,
    diskUsage: fragData.diskUsage ?? null,
    url: fragData.url,
    isPrivate: fragData.isPrivate ?? fragData.visibility === "PRIVATE",
    isFork: fragData.isFork,
    stargazerCount: fragData.stargazerCount,
    forkCount: fragData.forkCount,
    openGraphImageUrl: fragData.openGraphImageUrl ?? null,
    ownerLogin: fragData.owner.login,
    branch: fragData.defaultBranchRef?.name ?? null,
    languages:
      fragData.languages?.nodes
        ?.filter((lang): lang is NonNullable<typeof lang> => lang != null)
        .slice(0, 3)
        .map((lang) => ({
          id: lang.id,
          name: lang.name,
          color: lang.color ?? null,
        })) ?? [],
  };
  return <RepoCardSurface view={view} selection={selection} />;
}

function RepoCardSurface({
  view,
  selection,
}: {
  view: RepoCardView;
  selection: RepoCardSelection;
}) {
  const vscodeUrl = `https://vscode.dev/${view.url}`;
  const pushedLabel = view.pushedAt ? getRelativeTimeString(new Date(view.pushedAt)) : null;
  const disk = formatDiskUsage(view.diskUsage);
  const detailParams = { user: view.ownerLogin, repo: view.name };
  const showCheckbox = Boolean(selection.editing && selection.canSelect);

  return (
    <article
      className={`border-base-300 bg-base-200 hover:bg-primary/20 group relative flex h-full flex-col overflow-hidden rounded-xl border transition-colors duration-200 ease-out ${selection.selected ? "ring-primary/60 ring-2" : ""} ${selection.editing && !selection.canSelect ? "opacity-60" : ""}`}
      data-test={`repo-card-${view.name}`}
      data-selected={selection.selected ? "true" : undefined}
    >
      <div className="bg-base-300 relative aspect-16/9 overflow-hidden">
        <img
          src={view.openGraphImageUrl || undefined}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          onError={(event) => {
            event.currentTarget.src =
              "data:image/svg+xml," +
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect fill="oklch(0.22 0.02 260)" width="100%" height="100%"/><text x="50%" y="50%" fill="oklch(0.65 0.02 260)" font-family="ui-sans-serif,system-ui,sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">${view.name}</text></svg>`,
              );
          }}
        />
        {showCheckbox ? (
          <div
            className={`absolute top-3 left-3 z-20 rounded-lg border p-1.5 backdrop-blur-sm ${selection.selected ? "border-primary bg-primary/15" : "border-primary/50 bg-base-100/90"}`}
          >
            <Checkbox
              className="border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary size-5"
              checked={selection.selected}
              data-test={`repo-select-${view.name}`}
              aria-label={`Select ${view.nameWithOwner}`}
              onCheckedChange={() => {
                selection.onToggleSelect?.();
              }}
            />
          </div>
        ) : null}
        <Link
          to="/$user/repos/$repo"
          params={detailParams}
          className="absolute inset-0"
          aria-label={`Open ${view.name} details`}
          preload="intent"
          onClick={(event) => {
            if (selection.editing) {
              event.preventDefault();
              if (selection.canSelect) {
                selection.onToggleSelect?.();
              }
            }
          }}
        />
        <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
          <a
            href={vscodeUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-base-100/90 text-base-content/70 hover:text-base-content border-base-300 inline-flex size-8 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors"
            aria-label="Open in VS Code"
            data-test={`repo-vscode-${view.name}`}
          >
            <VscVscodeInsiders className="size-4" />
          </a>
          <a
            href={view.url}
            target="_blank"
            rel="noreferrer"
            className="bg-base-100/90 text-base-content/70 hover:text-base-content border-base-300 inline-flex size-8 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors"
            aria-label="Open on GitHub"
            data-test={`repo-github-${view.name}`}
          >
            <Github className="size-4" />
          </a>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-start gap-2">
            <Link
              to="/$user/repos/$repo"
              params={detailParams}
              preload="intent"
              className="group-hover:text-primary min-w-0 flex-1 truncate text-base font-semibold tracking-tight transition-colors"
              onClick={(event) => {
                if (selection.editing) {
                  event.preventDefault();
                  if (selection.canSelect) {
                    selection.onToggleSelect?.();
                  }
                }
              }}
            >
              {view.name}
            </Link>
            {view.isPrivate ? (
              <Lock className="text-base-content/40 mt-0.5 size-3.5 shrink-0" aria-label="Private" />
            ) : null}
            {view.isFork ? (
              <span className="bg-base-300 text-base-content/60 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                Fork
              </span>
            ) : null}
          </div>
          {view.ownerLogin ? (
            <p className="text-base-content/45 truncate text-xs">@{view.ownerLogin}</p>
          ) : null}
          <p className="text-base-content/65 line-clamp-2 min-h-10 text-sm leading-5">
            {view.description ?? "No description"}
          </p>
        </div>

        {view.languages.length > 0 ? (
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
            {view.languages.map((lang) => (
              <li
                key={lang.id}
                className="text-base-content/55 inline-flex items-center gap-1.5 text-xs"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: lang.color ?? "currentColor" }}
                  aria-hidden
                />
                {lang.name}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="border-base-300/80 text-base-content/45 mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5" aria-hidden />
            {view.stargazerCount}
          </span>
          <span className="inline-flex items-center gap-1" title="Forks">
            <Copy className="size-3.5" aria-hidden />
            {view.forkCount}
          </span>
          {view.branch ? (
            <span className="truncate font-mono text-[11px]">{view.branch}</span>
          ) : null}
          {pushedLabel ? <span className="ml-auto truncate">{pushedLabel}</span> : null}
          {disk ? <span className="text-base-content/35">{disk}</span> : null}
        </div>
      </div>
    </article>
  );
}

const RepoCardFragment = graphql`
  fragment RepoCard_repository on Repository {
    id
    name
    nameWithOwner
    description
    pushedAt
    diskUsage
    url
    visibility
    isPrivate
    isFork
    stargazerCount
    forkCount
    openGraphImageUrl
    owner {
      login
      url
      avatarUrl
    }
    primaryLanguage {
      id
      name
      color
    }
    languages(first: 3) {
      nodes {
        id
        name
        color
      }
    }
    defaultBranchRef {
      name
    }
  }
`;
