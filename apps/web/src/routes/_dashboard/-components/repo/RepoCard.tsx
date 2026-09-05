import type { GithubRepoNode } from "@/types/github";
import { getRelativeTimeString } from "@/utils/date-helpers";
import { Activity, ExternalLink, GitFork, Github, Lock, Star } from "lucide-react";
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

/**
 * Repository card matching the old dashboard look: OG image, languages,
 * activity, stars/forks, and external GitHub / VS Code links.
 */
export function RepoCard({ repo }: RepoCardProps) {
  const languages =
    repo.languages?.nodes?.filter((lang): lang is NonNullable<typeof lang> => lang != null).slice(0, 3) ??
    [];
  const ownerLogin = repo.owner?.login ?? repo.nameWithOwner.split("/")[0] ?? "";
  const vscodeUrl = `https://vscode.dev/${repo.url}`;
  const pushedLabel = repo.pushedAt
    ? getRelativeTimeString(new Date(repo.pushedAt))
    : null;
  const disk = formatDiskUsage(repo.diskUsage);
  const branch = repo.defaultBranchRef?.name;

  return (
    <li
      className="border-primary bg-primary/10 relative flex min-h-fit w-full flex-col justify-between rounded-2xl border md:min-h-[370px]"
      data-test={`repo-card-${repo.name}`}
    >
      <div className="flex w-full cursor-pointer flex-col justify-center gap-1">
        <img
          height={150}
          width={150}
          className="aspect-video max-h-[150px] w-full rounded-t-2xl object-cover brightness-90 hover:brightness-75 dark:brightness-50"
          loading="lazy"
          src={repo.openGraphImageUrl || undefined}
          alt=""
          onError={(event) => {
            event.currentTarget.src =
              "data:image/svg+xml," +
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320"><rect fill="%2318181b" width="100%" height="100%"/><text x="50%" y="50%" fill="%2371717a" font-family="sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle">${repo.name}</text></svg>`,
              );
          }}
        />

        <div className="flex h-full w-full gap-3 p-2">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-secondary flex w-full flex-col justify-center gap-2 p-2"
          >
            <div className="flex flex-col justify-center break-all">
              <div className="line-clamp-1 text-2xl font-bold">{repo.name}</div>
              <div className="text-base-content/70 line-clamp-2 text-sm">
                {repo.description ?? `${repo.name} repository`}
              </div>
              {ownerLogin ? (
                <div className="text-base-content/50 mt-1 text-xs">@{ownerLogin}</div>
              ) : null}
            </div>

            {languages.length > 0 ? (
              <div className="flex w-full flex-wrap gap-1">
                {languages.map((lang) => (
                  <div
                    key={lang.id}
                    style={{
                      borderStyle: "solid",
                      borderWidth: "1px",
                      borderColor: lang.color ?? "currentColor",
                    }}
                    className="m-px rounded-2xl px-1 py-px text-xs break-all"
                  >
                    {lang.name}
                  </div>
                ))}
              </div>
            ) : repo.primaryLanguage ? (
              <div className="flex w-full flex-wrap gap-1">
                <div
                  style={{
                    borderStyle: "solid",
                    borderWidth: "1px",
                    borderColor: repo.primaryLanguage.color ?? "currentColor",
                  }}
                  className="m-px rounded-2xl px-1 py-px text-xs break-all"
                >
                  {repo.primaryLanguage.name}
                </div>
              </div>
            ) : null}
          </a>
        </div>
      </div>

      {branch ? (
        <div className="text-base-content/70 flex w-full items-center justify-center gap-1 px-2 text-sm">
          <span className="text-secondary line-clamp-1">{branch}</span>
        </div>
      ) : null}

      <div className="flex w-full flex-wrap items-center justify-evenly gap-3 p-1 text-sm">
        {pushedLabel ? (
          <div className="flex items-center justify-center gap-1 text-xs font-bold">
            <Activity className="size-3.5" />
            {pushedLabel}
          </div>
        ) : null}
        <div className="flex items-center justify-center gap-1">
          <GitFork className="size-3.5" />
          {repo.forkCount ?? 0}
        </div>
        <div className="flex items-center justify-center gap-1">
          <Star className="size-3.5" />
          {repo.stargazerCount ?? 0}
        </div>
      </div>

      <div className="flex w-full items-center justify-center gap-3 p-1 pb-2">
        {repo.isPrivate ? <Lock className="text-error size-4" aria-label="Private" /> : null}
        {disk ? <div className="text-base-content/60 text-xs">{disk}</div> : null}
        <div className="flex items-center justify-center gap-3">
          <a
            target="_blank"
            rel="noreferrer"
            href={vscodeUrl}
            className="text-info hover:text-accent"
            aria-label="Open in VS Code"
            data-test={`repo-vscode-${repo.name}`}
          >
            <VscVscodeInsiders className="size-5" />
          </a>
          <a
            target="_blank"
            rel="noreferrer"
            href={repo.url}
            className="border-base-content hover:text-accent rounded-full border p-0.5"
            aria-label="Open on GitHub"
            data-test={`repo-github-${repo.name}`}
          >
            <Github className="size-5" />
          </a>
          <a
            target="_blank"
            rel="noreferrer"
            href={repo.url}
            className="text-base-content/50 hover:text-accent"
            aria-label="Open repository"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
    </li>
  );
}
