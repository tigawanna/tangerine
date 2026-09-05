import { RepoCard } from "@/routes/_dashboard/-components/repo/RepoCard";
import {
  pinnedReposQueryOptions,
  recentReposQueryOptions,
} from "@/data-access-layer/github/repos-query-options";
import type { GithubRepoNode } from "@/types/github";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_dashboard/$user/repos/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.query({ ...pinnedReposQueryOptions, staleTime: "static" }),
      context.queryClient.query({ ...recentReposQueryOptions, staleTime: "static" }),
    ]);
  },
  component: ReposPage,
});

function ReposPage() {
  const pinnedQuery = useSuspenseQuery(pinnedReposQueryOptions);
  const recentQuery = useSuspenseQuery(recentReposQueryOptions);

  const pinnedRepos = pinnedQuery.data?.data?.viewer.pinnedItems.nodes ?? [];
  const recentRepos = recentQuery.data?.data?.viewer.repositories.nodes ?? [];
  const recentErrors = recentQuery.data?.errors ?? [];

  const pinnedNames = new Set(pinnedRepos.map((repo) => repo.name));
  const unpinnedRecent = recentRepos.filter((repo) => !pinnedNames.has(repo.name));

  return (
    <div className="space-y-10" data-test="repos-page">
      <section className="space-y-3">
        <p className="text-base-content/60 text-sm tracking-[0.24em] uppercase">Repositories</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Your repos</h1>
        <p className="text-base-content/70 max-w-2xl text-base leading-7">
          Pinned highlights and recently updated repositories in one place.
        </p>
      </section>

      {recentErrors.length > 0 ? (
        <div
          className="border-warning/30 bg-warning/10 text-base-content flex items-start gap-3 rounded-xl border p-4"
          data-test="github-partial-errors"
        >
          <AlertCircle className="text-warning mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Some repositories could not be loaded</p>
            <p className="text-base-content/70 mt-1 text-sm">
              GitHub returned partial data. {recentErrors.length} repo
              {recentErrors.length === 1 ? "" : "s"} may be hidden due to token scope or org policy.
            </p>
          </div>
        </div>
      ) : null}

      <RepoSection
        id="pinned"
        title="Pinned"
        description="Repositories pinned on your GitHub profile."
        repos={pinnedRepos}
        emptyMessage="No pinned repositories found. Pin repos on GitHub to feature them here."
      />

      <RepoSection
        id="recent"
        title="Recently updated"
        description="Latest pushes across your repositories, newest first."
        repos={unpinnedRecent}
        emptyMessage="No repositories loaded. Sign in with GitHub to load your repos."
      />
    </div>
  );
}

interface RepoSectionProps {
  id: string;
  title: string;
  description: string;
  repos: GithubRepoNode[];
  emptyMessage: string;
}

function RepoSection({ id, title, description, repos, emptyMessage }: RepoSectionProps) {
  return (
    <section id={id} className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-base-content/70 mt-1 text-sm">{description}</p>
      </div>

      {repos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {repos.map((repo) => (
            <RepoCard key={repo.nameWithOwner} repo={repo} />
          ))}
        </div>
      ) : (
        <div
          className="border-base-300 text-base-content/70 rounded-xl border border-dashed p-8 text-sm"
          data-test={`${id}-empty`}
        >
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
