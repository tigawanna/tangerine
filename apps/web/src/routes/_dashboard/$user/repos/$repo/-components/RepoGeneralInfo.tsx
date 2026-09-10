import { getRelativeTimeString } from "@/utils/date-helpers";
import {
  Activity,
  Code2,
  Copy,
  ExternalLink,
  Github,
  Globe,
  HardDrive,
  Lock,
} from "lucide-react";
import { graphql, useFragment } from "react-relay";
import { EditRepoSettings } from "./EditRepoSettings";
import { StarRepoButton } from "./StarRepoButton";
import type { RepoGeneralInfo_repository$key } from "./__generated__/RepoGeneralInfo_repository.graphql";

type RepoGeneralInfoProps = {
  repository: RepoGeneralInfo_repository$key;
};

/**
 * Formats GitHub `diskUsage` (kilobytes) for display.
 */
function formatDiskUsage(kilobytes: number | null | undefined): string | null {
  if (kilobytes == null || kilobytes <= 0) return null;
  if (kilobytes < 1024) return `${kilobytes} KB`;
  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

/**
 * Rich repository overview header (topics, stats, star, feature chips).
 */
export function RepoGeneralInfo({ repository: repositoryKey }: RepoGeneralInfoProps) {
  const repository = useFragment(RepoGeneralInfoFragment, repositoryKey);

  const languages =
    repository.languages?.edges
      ?.map((edge) =>
        edge?.node
          ? {
              id: edge.node.id,
              name: edge.node.name,
              color: edge.node.color,
              size: edge.size,
            }
          : null,
      )
      .filter((lang): lang is NonNullable<typeof lang> => lang != null) ?? [];
  const totalLanguageSize = repository.languages?.totalSize ?? 0;

  const topics =
    repository.repositoryTopics?.nodes?.filter(
      (node): node is NonNullable<typeof node> => node != null,
    ) ?? [];

  const pushed = repository.pushedAt
    ? getRelativeTimeString(new Date(repository.pushedAt))
    : null;
  const updated = repository.updatedAt
    ? getRelativeTimeString(new Date(repository.updatedAt))
    : null;
  const disk = formatDiskUsage(repository.diskUsage);

  const statusChips = [
    repository.isArchived ? { label: "Archived", tone: "warning" as const } : null,
    repository.isFork ? { label: "Fork", tone: "muted" as const } : null,
    repository.isLocked ? { label: "Locked", tone: "warning" as const } : null,
    repository.isDisabled ? { label: "Disabled", tone: "warning" as const } : null,
    repository.isTemplate ? { label: "Template", tone: "muted" as const } : null,
    repository.isUserConfigurationRepository
      ? { label: "Config repo", tone: "muted" as const }
      : null,
  ].filter((chip): chip is NonNullable<typeof chip> => chip != null);

  const featureChips = [
    repository.hasIssuesEnabled ? "Issues" : null,
    repository.hasDiscussionsEnabled ? "Discussions" : null,
    repository.hasProjectsEnabled ? "Projects" : null,
    repository.hasWikiEnabled ? "Wiki" : null,
  ].filter((label): label is string => label != null);

  return (
    <header className="space-y-5" data-test="repo-general-info">
      {repository.openGraphImageUrl ? (
        <div className="border-base-300 bg-base-300 overflow-hidden rounded-xl border">
          <img
            src={repository.openGraphImageUrl}
            alt=""
            className="aspect-video w-full object-cover"
          />
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base-content/50 text-sm">{repository.nameWithOwner}</p>
          {repository.isPrivate ? (
            <Lock className="text-base-content/40 size-3.5" aria-label="Private" />
          ) : null}
          {statusChips.map((chip) => (
            <span
              key={chip.label}
              className={
                chip.tone === "warning"
                  ? "bg-warning/15 text-warning rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase"
                  : "bg-base-200 text-base-content/60 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase"
              }
            >
              {chip.label}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{repository.name}</h1>
          <EditRepoSettings repository={repository} />
        </div>
        <p className="text-base-content/70 max-w-2xl text-base leading-7">
          {repository.description ?? "No description"}
        </p>

        {topics.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" data-test="repo-topics">
            {topics.map((topic) => (
              <li
                key={topic.id}
                className="border-primary/30 text-primary rounded-full border px-2 py-0.5 text-xs"
              >
                {topic.topic.name}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StarRepoButton
          starrableId={repository.id}
          stargazerCount={repository.stargazerCount}
          viewerHasStarred={repository.viewerHasStarred}
        />

        <span
          className="text-base-content/55 inline-flex items-center gap-1.5 text-sm"
          title="Forks"
        >
          <Copy className="size-3.5" aria-hidden />
          {repository.forkCount.toLocaleString()}
        </span>

        {pushed ? (
          <span className="text-base-content/55 inline-flex items-center gap-1.5 text-sm">
            <Activity className="size-3.5" aria-hidden />
            Pushed {pushed}
          </span>
        ) : updated ? (
          <span className="text-base-content/55 text-sm">Updated {updated}</span>
        ) : null}

        {disk ? (
          <span className="text-base-content/45 inline-flex items-center gap-1.5 text-sm">
            <HardDrive className="size-3.5" aria-hidden />
            {disk}
          </span>
        ) : null}
      </div>

      {languages.length > 0 ? (
        <div className="space-y-2" data-test="repo-languages">
          {totalLanguageSize > 0 ? (
            <div className="bg-base-300 flex h-2 overflow-hidden rounded-full" aria-hidden>
              {languages.map((lang) => {
                const pct = (lang.size / totalLanguageSize) * 100;
                if (pct < 0.5) return null;
                return (
                  <span
                    key={lang.id}
                    className="h-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: lang.color ?? "currentColor",
                    }}
                  />
                );
              })}
            </div>
          ) : null}
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
            {languages.map((lang) => {
              const pct =
                totalLanguageSize > 0
                  ? Math.round((lang.size / totalLanguageSize) * 1000) / 10
                  : null;
              return (
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
                  {pct != null ? (
                    <span className="text-base-content/35 tabular-nums">{pct}%</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {featureChips.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" data-test="repo-features">
          {featureChips.map((label) => (
            <li
              key={label}
              className="bg-base-200/70 text-base-content/55 rounded-md px-2 py-0.5 text-[11px]"
            >
              {label}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <a
          href={repository.url}
          target="_blank"
          rel="noopener noreferrer"
          className="border-base-300 bg-base-200/50 hover:bg-base-200 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
          data-test="repo-detail-github"
        >
          <Github className="size-4" />
          GitHub
          <ExternalLink className="size-3.5 opacity-50" />
        </a>
        <a
          href={`https://vscode.dev/${repository.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border-base-300 hover:bg-base-200/50 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
          data-test="repo-detail-vscode"
        >
          <Code2 className="size-4" />
          VS Code
          <ExternalLink className="size-3.5 opacity-50" />
        </a>
        {repository.homepageUrl ? (
          <a
            href={repository.homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-base-300 hover:bg-base-200/50 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
            data-test="repo-detail-homepage"
          >
            <Globe className="size-4" />
            Homepage
            <ExternalLink className="size-3.5 opacity-50" />
          </a>
        ) : null}
      </div>
    </header>
  );
}

export const RepoGeneralInfoFragment = graphql`
  fragment RepoGeneralInfo_repository on Repository {
    id
    name
    nameWithOwner
    description
    url
    homepageUrl
    openGraphImageUrl
    pushedAt
    updatedAt
    diskUsage
    forkCount
    stargazerCount
    viewerHasStarred
    isPrivate
    isArchived
    isFork
    isLocked
    isDisabled
    isTemplate
    isUserConfigurationRepository
    hasIssuesEnabled
    hasDiscussionsEnabled
    hasProjectsEnabled
    hasWikiEnabled
    repositoryTopics(first: 20) {
      nodes {
        id
        topic {
          name
        }
      }
    }
    languages(first: 20) {
      totalSize
      edges {
        size
        node {
          id
          name
          color
        }
      }
    }
    ...EditRepoSettings_repository
  }
`;
