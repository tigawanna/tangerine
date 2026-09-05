import { RepoCard } from "@/routes/_dashboard/-components/repo/RepoCard";
import {
  pinnedReposQueryOptions,
  recentReposQueryOptions,
} from "@/data-access-layer/github/repos-query-options";
import type { GithubRepoNode } from "@/types/github";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { z } from "zod";

const repoViewOptions = ["all", "pinned", "forks"] as const;

const searchparams = z.object({
  view: z.enum(repoViewOptions).default("all"),
});

export const Route = createFileRoute("/_dashboard/$user/repos/")({
  validateSearch: (search) => searchparams.parse(search),
  loaderDeps: ({ search: { view } }) => ({ view }),
  loader: async ({ context, deps }) => {
    if (deps.view === "pinned") {
      await context.queryClient.query({ ...pinnedReposQueryOptions, staleTime: "static" });
      return;
    }
    const isFork = deps.view === "forks" ? true : deps.view === "all" ? false : null;
    await context.queryClient.query({
      ...recentReposQueryOptions(isFork),
      staleTime: "static",
    });
  },
  component: ReposPage,
});

function ReposPage() {
  const navigate = Route.useNavigate();
  const { view } = Route.useSearch();
  const { user } = Route.useParams();

  return (
    <div className="space-y-6" data-test="repos-page">
      <section className="space-y-3">
        <p className="text-base-content/60 text-sm tracking-[0.24em] uppercase">Repositories</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">@{user}&apos;s repos</h1>
        <p className="text-base-content/70 max-w-2xl text-base leading-7">
          Filter by sources, pinned highlights, or forks — one view at a time.
        </p>
      </section>

      <Tabs
        value={view}
        onValueChange={(next) => {
          void navigate({
            search: (prev) => ({
              ...prev,
              view: next as (typeof repoViewOptions)[number],
            }),
            replace: true,
          });
        }}
        className="w-full"
      >
        <TabsList
          variant="line"
          className="border-base-300 mb-4 grid h-auto w-full grid-cols-3 border-b bg-transparent p-0"
          data-test="repos-view-tabs"
        >
          <TabsTrigger value="all" data-test="repos-tab-all">
            Sources
          </TabsTrigger>
          <TabsTrigger value="pinned" data-test="repos-tab-pinned">
            Pinned
          </TabsTrigger>
          <TabsTrigger value="forks" data-test="repos-tab-forks">
            Forks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <RecentReposList isFork={false} emptyMessage="No source repositories found." />
        </TabsContent>
        <TabsContent value="pinned" className="mt-0">
          <PinnedReposList />
        </TabsContent>
        <TabsContent value="forks" className="mt-0">
          <RecentReposList isFork={true} emptyMessage="No forked repositories found." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RecentReposList({
  isFork,
  emptyMessage,
}: {
  isFork: boolean;
  emptyMessage: string;
}) {
  const recentQuery = useSuspenseQuery(recentReposQueryOptions(isFork));
  const repos = recentQuery.data?.data?.viewer.repositories.nodes ?? [];
  const errors = recentQuery.data?.errors ?? [];

  return (
    <RepoGrid
      repos={repos}
      errors={errors}
      emptyMessage={emptyMessage}
      emptyTestId={isFork ? "forks-empty" : "sources-empty"}
    />
  );
}

function PinnedReposList() {
  const pinnedQuery = useSuspenseQuery(pinnedReposQueryOptions);
  const repos = pinnedQuery.data?.data?.viewer.pinnedItems.nodes ?? [];

  return (
    <RepoGrid
      repos={repos}
      errors={[]}
      emptyMessage="No pinned repositories. Pin repos on GitHub to feature them here."
      emptyTestId="pinned-empty"
    />
  );
}

function RepoGrid({
  repos,
  errors,
  emptyMessage,
  emptyTestId,
}: {
  repos: GithubRepoNode[];
  errors: { message?: string }[];
  emptyMessage: string;
  emptyTestId: string;
}) {
  return (
    <div className="space-y-4">
      {errors.length > 0 ? (
        <div
          className="border-warning/30 bg-warning/10 text-base-content flex items-start gap-3 rounded-xl border p-4"
          data-test="github-partial-errors"
        >
          <AlertCircle className="text-warning mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Some repositories could not be loaded</p>
            <p className="text-base-content/70 mt-1 text-sm">
              GitHub returned partial data. {errors.length} repo
              {errors.length === 1 ? "" : "s"} may be hidden due to token scope or org policy.
            </p>
          </div>
        </div>
      ) : null}

      {repos.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {repos.map((repo) => (
            <li key={repo.nameWithOwner} className="min-w-0">
              <RepoCard repo={repo} />
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="border-base-300 text-base-content/70 rounded-xl border border-dashed p-8 text-sm"
          data-test={emptyTestId}
        >
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
