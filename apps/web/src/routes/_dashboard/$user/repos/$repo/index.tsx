import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { repoDetailQueryOptions } from "@/data-access-layer/github/repo-detail-query-options";
import { defaultUserSearch } from "@/routes/_dashboard/$user/layout";
import { getRelativeTimeString } from "@/utils/date-helpers";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, ExternalLink, FolderX, Github, Lock, TriangleAlert } from "lucide-react";
import { RepoReadme } from "./-components/RepoReadme";

export const Route = createFileRoute("/_dashboard/$user/repos/$repo/")({
  loader: async ({ context, params }) => {
    await context.queryClient.query({
      ...repoDetailQueryOptions(params.user, params.repo),
      staleTime: "static",
    });
  },
  component: RepoDetailPage,
});

function RepoDetailPage() {
  const { user, repo } = Route.useParams();
  const router = useRouter();
  const { data } = useSuspenseQuery(repoDetailQueryOptions(user, repo));
  const repository = data.data;
  const readme = data.readme;
  const readmePath = data.readmePath;

  const backActions = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => router.history.back()}
        data-test="repo-detail-history-back"
      >
        <ArrowLeft />
        Go back
      </Button>
      <Button asChild data-test="repo-detail-back">
        <Link to="/$user" params={{ user }} search={defaultUserSearch}>
          {user}&apos;s profile
        </Link>
      </Button>
    </div>
  );

  if (data.error) {
    return (
      <Empty
        className="border-base-300 bg-base-200/20 min-h-80 border border-dashed"
        data-test="repo-detail-error"
      >
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-error/15 text-error rotate-3">
            <TriangleAlert />
          </EmptyMedia>
          <EmptyTitle>Repo hiccup</EmptyTitle>
          <EmptyDescription>
            Couldn&apos;t load{" "}
            <span className="font-mono">
              {user}/{repo}
            </span>
            . {data.error}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>{backActions}</EmptyContent>
      </Empty>
    );
  }

  if (!repository) {
    return (
      <Empty
        className="border-base-300 bg-base-200/20 min-h-80 border border-dashed"
        data-test="repo-detail-not-found"
      >
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-warning/15 text-warning -rotate-6">
            <FolderX />
          </EmptyMedia>
          <EmptyTitle>
            No <span className="font-mono">{repo}</span> here
          </EmptyTitle>
          <EmptyDescription>
            GitHub has nothing at{" "}
            <span className="font-mono">
              {user}/{repo}
            </span>
            — typo, rename, or private to someone else.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>{backActions}</EmptyContent>
      </Empty>
    );
  }

  const languages =
    repository.languages?.edges
      ?.map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => node != null) ?? [];
  const updated = repository.updatedAt
    ? getRelativeTimeString(new Date(repository.updatedAt))
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8" data-test="repo-detail-page">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="text-base-content/60 hover:text-base-content inline-flex items-center gap-2 text-sm transition-colors"
          onClick={() => router.history.back()}
          data-test="repo-detail-history-back"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <Link
          to="/$user"
          params={{ user }}
          search={defaultUserSearch}
          className="text-base-content/60 hover:text-base-content inline-flex items-center gap-2 text-sm transition-colors"
          data-test="repo-detail-back"
        >
          <ArrowLeft className="size-4" />
          {user}
        </Link>
      </div>

      {repository.openGraphImageUrl ? (
        <div className="border-base-300 bg-base-300 overflow-hidden rounded-xl border">
          <img
            src={repository.openGraphImageUrl}
            alt=""
            className="aspect-video w-full object-cover"
          />
        </div>
      ) : null}

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base-content/50 text-sm">{repository.nameWithOwner}</p>
          {repository.isPrivate ? (
            <Lock className="text-base-content/40 size-3.5" aria-label="Private" />
          ) : null}
          {repository.isFork ? (
            <span className="bg-base-200 text-base-content/60 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
              Fork
            </span>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{repository.name}</h1>
        <p className="text-base-content/70 max-w-2xl text-base leading-7">
          {repository.description ?? "No description"}
        </p>

        <div className="text-base-content/50 flex flex-wrap items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5" title="Forks">
            <Copy className="size-3.5" aria-hidden />
            {repository.forkCount}
          </span>
          {updated ? <span>Updated {updated}</span> : null}
        </div>

        {languages.length > 0 ? (
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
            {languages.map((lang) => (
              <li
                key={lang.name}
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

        <div className="flex flex-wrap gap-3 pt-2">
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
          {repository.homepageUrl ? (
            <a
              href={repository.homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-base-300 hover:bg-base-200/50 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
            >
              Homepage
              <ExternalLink className="size-3.5 opacity-50" />
            </a>
          ) : null}
        </div>
      </header>

      {readme ? <RepoReadme source={readme} path={readmePath} /> : null}
    </div>
  );
}
