import { UserInfo } from "./UserInfo";
import { OwnerCard } from "./OwnerCard";
import {
  PeopleSearchInput,
  StarOrderSelect,
  StarOwnedByViewerSwitch,
  TabFilterBar,
} from "../repos/RepoFilters";
import { ReposTabPanel } from "../repos/ReposTabPanel";
import { UserStarredRepos } from "../starred/UserStarredRepos";
import {
  FollowersFollowBackAll,
  UserFollowersList,
} from "../followers/UserFollowersList";
import { UserFollowingList } from "../following/UserFollowingList";
import { userQuery, userTabOptions, resolveUserSearch, defaultUserSearch } from "../../layout";
import type { layoutUserPageLoaderQuery } from "../../__generated__/layoutUserPageLoaderQuery.graphql";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRouteApi, Link, useRouteContext, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Search, UserRoundX } from "lucide-react";
import { Activity, Suspense, startTransition } from "react";
import { usePreloadedQuery } from "react-relay";

const userRoute = getRouteApi("/_dashboard/$user/");

type ProfileTab = (typeof userTabOptions)[number];

/**
 * Profile hub for Users and Organizations.
 * Orgs use `repositoryOwner` (no `organization {}` — that needs `read:org`).
 */
export function UserPage() {
  const navigate = userRoute.useNavigate();
  const { user: login } = userRoute.useParams();
  const { githubLogin } = useRouteContext({ from: "/_dashboard" });
  const router = useRouter();
  const { tab } = resolveUserSearch(userRoute.useSearch());
  const query = useOwnerQuery();
  const user = query.user;
  const owner = query.repositoryOwner;
  const isOrg = owner?.__typename === "Organization";

  const tabs = (user
    ? (["repos", "starred", "followers", "following"] as const)
    : (["repos"] as const)) satisfies readonly ProfileTab[];

  const activeTab: ProfileTab = (tabs as readonly string[]).includes(tab) ? tab : "repos";

  if (!user && !owner) {
    const homeLogin = githubLogin ?? undefined;

    return (
      <Empty
        className="border-base-300 bg-base-200/20 mx-auto min-h-80 max-w-6xl border border-dashed"
        data-test="owner-not-found"
      >
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-warning/15 text-warning -rotate-6">
            <UserRoundX />
          </EmptyMedia>
          <EmptyTitle>
            No one named <span className="font-mono">@{login}</span>
          </EmptyTitle>
          <EmptyDescription>
            GitHub has no user or org by that login — or it&apos;s tucked away where we can&apos;t
            see it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="gap-4">
          <div className="flex w-full max-w-xs flex-col gap-2">
            {homeLogin ? (
              <Button
                asChild
                size="lg"
                className="w-full active:scale-[0.98]"
                data-test="owner-not-found-home"
              >
                <Link to="/$user" params={{ user: homeLogin }} search={defaultUserSearch}>
                  Take me home
                </Link>
              </Button>
            ) : null}
            {homeLogin ? (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-base-300 bg-base-100/60 w-full active:scale-[0.98]"
                data-test="owner-not-found-search"
              >
                <Link
                  to="/$user/search"
                  params={{ user: homeLogin }}
                  search={{ q: login, type: "USER" }}
                >
                  <Search />
                  Hunt for @{login}
                </Link>
              </Button>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-base-content/55 hover:text-base-content"
            onClick={() => router.history.back()}
            data-test="owner-not-found-back"
          >
            <ArrowLeft />
            Go back
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8" data-test="user-page">
      <Suspense fallback={<HeaderFallback />}>
        {user ? <UserInfo user={user} /> : owner ? <OwnerCard owner={owner} /> : null}
      </Suspense>

      <Tabs
        value={activeTab}
        onValueChange={(next) => {
          startTransition(() => {
            void navigate({
              search: (prev) => ({
                ...prev,
                tab: next as ProfileTab,
              }),
              replace: true,
            });
          });
        }}
        className="w-full"
      >
        <TabsList
          variant="line"
          className="border-base-300 mb-6 grid h-auto w-full grid-cols-2 gap-0 border-b bg-transparent p-0 lg:grid-cols-4"
          data-test="user-tabs"
        >
          {tabs.map((value) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-none px-3 py-2.5 capitalize"
              data-test={`user-tab-${value}`}
            >
              {value}
            </TabsTrigger>
          ))}
        </TabsList>

        {owner ? (
          <Activity mode={activeTab === "repos" ? "visible" : "hidden"}>
            <ReposTabPanel owner={owner} />
          </Activity>
        ) : null}

        {user ? (
          <>
            <Activity mode={activeTab === "starred" ? "visible" : "hidden"}>
              <div role="tabpanel" className="mt-0 space-y-4" data-test="user-tabpanel-starred">
                <TabFilterBar testId="starred-filters">
                  <StarOrderSelect />
                  <StarOwnedByViewerSwitch />
                </TabFilterBar>
                <Suspense fallback={<TabFallback label="starred repos" />}>
                  <UserStarredRepos starredReposKey={user} />
                </Suspense>
              </div>
            </Activity>

            <Activity mode={activeTab === "followers" ? "visible" : "hidden"}>
              <div role="tabpanel" className="mt-0 space-y-4" data-test="user-tabpanel-followers">
                <TabFilterBar testId="followers-filters">
                  <PeopleSearchInput placeholder="Filter by name or login…" />
                  <Suspense fallback={null}>
                    <FollowersFollowBackAll followersKey={user} />
                  </Suspense>
                </TabFilterBar>
                <Suspense fallback={<TabFallback label="followers" />}>
                  <UserFollowersList followersKey={user} />
                </Suspense>
              </div>
            </Activity>

            <Activity mode={activeTab === "following" ? "visible" : "hidden"}>
              <div role="tabpanel" className="mt-0 space-y-4" data-test="user-tabpanel-following">
                <TabFilterBar testId="following-filters">
                  <PeopleSearchInput placeholder="Filter by name or login…" />
                </TabFilterBar>
                <Suspense fallback={<TabFallback label="following" />}>
                  <UserFollowingList followingKey={user} />
                </Suspense>
              </div>
            </Activity>
          </>
        ) : null}

        {isOrg ? (
          <p className="text-base-content/45 text-center text-xs" data-test="org-scope-hint">
            Org members need the <code className="font-mono">read:org</code> GitHub scope — sign out
            and back in after it is enabled.
          </p>
        ) : null}
      </Tabs>
    </div>
  );
}

function useOwnerQuery() {
  const queryRef = userRoute.useLoaderData();
  return usePreloadedQuery<layoutUserPageLoaderQuery>(userQuery, queryRef);
}

function HeaderFallback() {
  return (
    <div className="border-base-300 bg-base-200/20 h-40 animate-pulse rounded-2xl border" />
  );
}

function TabFallback({ label }: { label: string }) {
  return (
    <div className="border-base-300 bg-base-200/20 text-base-content/50 rounded-xl border border-dashed p-10 text-center text-sm">
      Loading {label}…
    </div>
  );
}
