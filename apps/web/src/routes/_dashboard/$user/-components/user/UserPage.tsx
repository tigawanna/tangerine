import { UserInfo } from "./UserInfo";
import { UserRepos } from "../repos/UserRepos";
import { RepoIsForkSwitch, RepoOrderSelect } from "../repos/RepoFilters";
import { UserStarredRepos } from "../starred/UserStarredRepos";
import { UserFollowersList } from "../followers/UserFollowersList";
import { UserFollowingList } from "../following/UserFollowingList";
import { userQuery, userTabOptions } from "../../layout";
import type { layoutUserPageLoaderQuery } from "../../__generated__/layoutUserPageLoaderQuery.graphql";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRouteApi } from "@tanstack/react-router";
import { Activity, Suspense, startTransition } from "react";
import { usePreloadedQuery } from "react-relay";

const userRoute = getRouteApi("/_dashboard/$user");

/**
 * Profile hub — UserInfo + tabs for repos / starred / followers / following.
 * Panels use React `Activity` so switching tabs keeps state / Relay data warm.
 * Repo filters stay outside the list Suspense so they remain usable while it reloads.
 */
export function UserPage() {
  const navigate = userRoute.useNavigate();
  const { tab } = userRoute.useSearch();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8" data-test="user-page">
      <Suspense fallback={<HeaderFallback />}>
        <UserHeader />
      </Suspense>

      <Tabs
        value={tab}
        onValueChange={(next) => {
          startTransition(() => {
            void navigate({
              search: (prev) => ({
                ...prev,
                tab: next as (typeof userTabOptions)[number],
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
          <TabsTrigger
            value="repos"
            className="rounded-none px-3 py-2.5"
            data-test="user-tab-repos"
          >
            Repos
          </TabsTrigger>
          <TabsTrigger
            value="starred"
            className="rounded-none px-3 py-2.5"
            data-test="user-tab-starred"
          >
            Starred
          </TabsTrigger>
          <TabsTrigger
            value="followers"
            className="rounded-none px-3 py-2.5"
            data-test="user-tab-followers"
          >
            Followers
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="rounded-none px-3 py-2.5"
            data-test="user-tab-following"
          >
            Following
          </TabsTrigger>
        </TabsList>

        <Activity mode={tab === "repos" ? "visible" : "hidden"}>
          <div
            role="tabpanel"
            className="mt-0 space-y-4"
            data-test="user-tabpanel-repos"
          >
            <div
              className="border-base-300 bg-base-200/30 sticky top-0 z-20 flex flex-wrap items-center justify-end gap-3 rounded-xl border px-3 py-2 backdrop-blur-sm"
              data-test="repo-filters"
            >
              <RepoOrderSelect />
              <RepoIsForkSwitch />
            </div>
            <Suspense fallback={<TabFallback label="repos" />}>
              <ReposTab />
            </Suspense>
          </div>
        </Activity>

        <Activity mode={tab === "starred" ? "visible" : "hidden"}>
          <div role="tabpanel" className="mt-0" data-test="user-tabpanel-starred">
            <Suspense fallback={<TabFallback label="starred repos" />}>
              <StarredTab />
            </Suspense>
          </div>
        </Activity>

        <Activity mode={tab === "followers" ? "visible" : "hidden"}>
          <div role="tabpanel" className="mt-0" data-test="user-tabpanel-followers">
            <Suspense fallback={<TabFallback label="followers" />}>
              <FollowersTab />
            </Suspense>
          </div>
        </Activity>

        <Activity mode={tab === "following" ? "visible" : "hidden"}>
          <div role="tabpanel" className="mt-0" data-test="user-tabpanel-following">
            <Suspense fallback={<TabFallback label="following" />}>
              <FollowingTab />
            </Suspense>
          </div>
        </Activity>
      </Tabs>
    </div>
  );
}

function useUserQuery() {
  const queryRef = userRoute.useLoaderData();
  return usePreloadedQuery<layoutUserPageLoaderQuery>(userQuery, queryRef);
}

function UserHeader() {
  const query = useUserQuery();
  if (!query.user) {
    return (
      <div
        className="border-error/30 bg-error/10 text-base-content rounded-xl border p-4"
        data-test="user-not-found"
      >
        <p className="font-medium">User not found</p>
        <p className="text-base-content/70 mt-1 text-sm">
          GitHub returned no profile for this login.
        </p>
      </div>
    );
  }
  return <UserInfo user={query.user} />;
}

function ReposTab() {
  const query = useUserQuery();
  if (!query.user) return null;
  return <UserRepos userReposKey={query.user} />;
}

function StarredTab() {
  const query = useUserQuery();
  if (!query.user) return null;
  return <UserStarredRepos starredReposKey={query.user} />;
}

function FollowersTab() {
  const query = useUserQuery();
  if (!query.user) return null;
  return <UserFollowersList followersKey={query.user} />;
}

function FollowingTab() {
  const query = useUserQuery();
  if (!query.user) return null;
  return <UserFollowingList followingKey={query.user} />;
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
