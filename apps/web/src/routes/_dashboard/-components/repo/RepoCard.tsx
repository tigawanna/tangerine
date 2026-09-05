import type { GithubRepoNode } from "@/types/github";
import { getRelativeTimeString } from "@/utils/date-helpers";
import { Link } from "@tanstack/react-router";
import { Copy, Github, Lock, Star } from "lucide-react";
import { VscVscodeInsiders } from "react-icons/vsc";

interface RepoCardProps {
  repo: GithubRepoNode;
}

/**
 * Formats GitHub `diskUsage` (kilobytes) for display on repo cards.
 */
function formatDiskUsage(kilobytes: number | null | undefined): string | null {
  if (kilobytes == null || kilobytes <= 0) return null;
  if (kilobytes < 1024) return `${kilobytes} KB`;
  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function languageList(repo: GithubRepoNode) {
  const fromNodes =
    repo.languages?.nodes?.filter((lang): lang is NonNullable<typeof lang> => lang != null) ?? [];
  if (fromNodes.length > 0) return fromNodes.slice(0, 3);
  if (repo.primaryLanguage) return [repo.primaryLanguage];
  return [];
}

/**
 * Modern repository card. Primary navigation goes to in-app repo details;
 * GitHub / VS Code stay as explicit external actions.
 */
export function RepoCard({ repo }: RepoCardProps) {
  const languages = languageList(repo);
  const ownerLogin = repo.owner?.login ?? repo.nameWithOwner.split("/")[0] ?? "";
  const vscodeUrl = `https://vscode.dev/${repo.url}`;
  const pushedLabel = repo.pushedAt ? getRelativeTimeString(new Date(repo.pushedAt)) : null;
  const disk = formatDiskUsage(repo.diskUsage);
  const branch = repo.defaultBranchRef?.name;
  const detailParams = { user: ownerLogin, repo: repo.name };

  return (
    <article
      className="border-base-300 bg-base-100 group relative flex h-full flex-col overflow-hidden rounded-xl border transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-base-content/20 hover:shadow-lg hover:shadow-base-content/5"
      data-test={`repo-card-${repo.name}`}
    >
      <div className="bg-base-300 relative aspect-video overflow-hidden">
        <img
          src={repo.openGraphImageUrl || undefined}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          onError={(event) => {
            event.currentTarget.src =
              "data:image/svg+xml," +
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect fill="oklch(0.22 0.02 260)" width="100%" height="100%"/><text x="50%" y="50%" fill="oklch(0.65 0.02 260)" font-family="ui-sans-serif,system-ui,sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">${repo.name}</text></svg>`,
              );
          }}
        />
        <Link
          to="/$user/repos/$repo"
          params={detailParams}
          className="absolute inset-0"
          aria-label={`Open ${repo.name} details`}
          preload="intent"
        />
        <div className="from-base-100 via-base-100/50 pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-t to-transparent" />
        <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
          <a
            href={vscodeUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-base-100/90 text-base-content/70 hover:text-base-content border-base-300 inline-flex size-8 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors"
            aria-label="Open in VS Code"
            data-test={`repo-vscode-${repo.name}`}
          >
            <VscVscodeInsiders className="size-4" />
          </a>
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="bg-base-100/90 text-base-content/70 hover:text-base-content border-base-300 inline-flex size-8 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors"
            aria-label="Open on GitHub"
            data-test={`repo-github-${repo.name}`}
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
              className="hover:text-primary min-w-0 flex-1 truncate text-base font-semibold tracking-tight transition-colors"
            >
              {repo.name}
            </Link>
            {repo.isPrivate ? (
              <Lock className="text-base-content/40 mt-0.5 size-3.5 shrink-0" aria-label="Private" />
            ) : null}
            {repo.isFork ? (
              <span className="bg-base-200 text-base-content/60 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                Fork
              </span>
            ) : null}
          </div>
          {ownerLogin ? (
            <p className="text-base-content/45 truncate text-xs">@{ownerLogin}</p>
          ) : null}
          <p className="text-base-content/65 line-clamp-2 min-h-10 text-sm leading-5">
            {repo.description ?? "No description"}
          </p>
        </div>

        {languages.length > 0 ? (
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
            {languages.map((lang) => (
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
            {repo.stargazerCount ?? 0}
          </span>
          <span className="inline-flex items-center gap-1" title="Forks">
            <Copy className="size-3.5" aria-hidden />
            {repo.forkCount ?? 0}
          </span>
          {branch ? <span className="truncate font-mono text-[11px]">{branch}</span> : null}
          {pushedLabel ? <span className="ml-auto truncate">{pushedLabel}</span> : null}
          {disk ? <span className="text-base-content/35">{disk}</span> : null}
        </div>
      </div>
    </article>
  );
}
