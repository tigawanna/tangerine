import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { defaultUserSearch } from "@/routes/_dashboard/$user/layout";
import { getRouteApi, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, FolderX } from "lucide-react";
import { Suspense, startTransition } from "react";
import { graphql, usePreloadedQuery, type PreloadedQuery } from "react-relay";
import { Branches } from "./Branches";
import { RepoGeneralInfo } from "./RepoGeneralInfo";
import { RepoReadmePanel } from "./RepoReadmePanel";
import type { RepoDetailPageQuery as RepoDetailPageQueryType } from "./__generated__/RepoDetailPageQuery.graphql";

const repoRoute = getRouteApi("/_dashboard/$user/repos/$repo/");

const repoTabOptions = ["readme", "branches"] as const;
type RepoTab = (typeof repoTabOptions)[number];

type RepoDetailPageProps = {
  queryRef: PreloadedQuery<RepoDetailPageQueryType>;
};

/**
 * Repository detail view — Relay for metadata/branches, REST for README.
 */
export function RepoDetailPage({ queryRef }: RepoDetailPageProps) {
  const { user, repo } = repoRoute.useParams();
  const { tab } = repoRoute.useSearch();
  const navigate = repoRoute.useNavigate();
  const router = useRouter();
  const data = usePreloadedQuery<RepoDetailPageQueryType>(repoDetailPageQuery, queryRef);
  const repository = data.repository;
  const activeTab: RepoTab = tab === "branches" ? "branches" : "readme";

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
          {user}
        </Link>
      </div>

      <RepoGeneralInfo repository={repository} />

      <Tabs
        value={activeTab}
        onValueChange={(next) => {
          startTransition(() => {
            void navigate({
              search: (prev) => ({
                ...prev,
                tab: next === "readme" ? undefined : (next as RepoTab),
              }),
              replace: true,
            });
          });
        }}
        className="w-full gap-0"
      >
        <TabsList
          variant="line"
          className="border-base-300 mb-6 grid h-auto w-full grid-cols-2 gap-0 border-b bg-transparent p-0"
          data-test="repo-detail-tabs"
        >
          <TabsTrigger
            value="readme"
            className="rounded-none px-3 py-2.5 capitalize"
            data-test="repo-tab-readme"
          >
            README
          </TabsTrigger>
          <TabsTrigger
            value="branches"
            className="rounded-none px-3 py-2.5 capitalize"
            data-test="repo-tab-branches"
          >
            Branches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="readme" className="mt-0">
          <Suspense
            fallback={
              <div
                className="border-base-300 bg-base-200/20 h-56 animate-pulse rounded-xl border"
                data-test="repo-readme-loading"
              />
            }
          >
            <RepoReadmePanel owner={user} repo={repo} />
          </Suspense>
        </TabsContent>

        <TabsContent value="branches" className="mt-0">
          <Suspense
            fallback={
              <div
                className="border-base-300 bg-base-200/20 h-40 animate-pulse rounded-xl border"
                data-test="repo-branches-loading"
              />
            }
          >
            <Branches
              data={repository}
              defaultBranchName={repository.defaultBranchRef?.name ?? null}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const repoDetailPageQuery = graphql`
  query RepoDetailPageQuery($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        name
        id
      }
      ...RepoGeneralInfo_repository
      ...Branches_refs
    }
  }
`;
