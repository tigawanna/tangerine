import { UserInfo } from "./UserInfo";
import { OwnerCard } from "./OwnerCard";
import { UserRepos } from "../repos/UserRepos";
import {
  PeopleSearchInput,
  RepoIsForkSwitch,
  RepoOrderSelect,
  StarOrderSelect,
  StarOwnedByViewerSwitch,
  TabFilterBar,
} from "../repos/RepoFilters";
import { UserStarredRepos } from "../starred/UserStarredRepos";
import { UserFollowersList } from "../followers/UserFollowersList";
import { UserFollowingList } from "../following/UserFollowingList";
import { userQuery, userTabOptions } from "../../layout";
import type { layoutUserPageLoaderQuery } from "../../__generated__/layoutUserPageLoaderQuery.graphql";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRouteApi } from "@tanstack/react-router";
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
  const { tab } = userRoute.useSearch();
  const query = useOwnerQuery();
  const user = query.user;
  const owner = query.repositoryOwner;
  const isOrg = owner?.__typename === "Organization";

  const tabs = (user
    ? (["repos", "starred", "followers", "following"] as const)
    : (["repos"] as const)) satisfies readonly ProfileTab[];

  const activeTab: ProfileTab = (tabs as readonly string[]).includes(tab) ? tab : "repos";

  if (!user && !owner) {
    return (
      <div
        className="border-error/30 bg-error/10 text-base-content mx-auto max-w-6xl rounded-xl border p-4"
        data-test="owner-not-found"
      >
        <p className="font-medium">Profile not found</p>
        <p className="text-base-content/70 mt-1 text-sm">
          GitHub returned no user or organization for this login.
        </p>
      </div>
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
            <div role="tabpanel" className="mt-0 space-y-4" data-test="user-tabpanel-repos">
              <TabFilterBar testId="repo-filters">
                <RepoOrderSelect />
                <RepoIsForkSwitch />
              </TabFilterBar>
              <Suspense fallback={<TabFallback label="repos" />}>
                <UserRepos userReposKey={owner} />
              </Suspense>
            </div>
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
