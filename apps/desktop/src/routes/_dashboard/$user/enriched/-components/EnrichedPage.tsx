import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { enrichUserReposCollection } from "@/data-access-layer/enriched/repos-enriched-collection.ts";
import { enrichStarredReposCollection } from "@/data-access-layer/enriched/starred-enriched-collection.ts";
import { useEmbedActivitySse } from "@/hooks/use-embed-activity-sse.ts";
import { useUserReposEmbedActivitySse } from "@/hooks/use-user-repos-embed-activity-sse.ts";
import {
  enrichedRouteID,
  enrichedTabs,
} from "@/routes/_dashboard/$user/enriched/-components/constants.ts";
import { EnrichedRepos } from "@/routes/_dashboard/$user/enriched/-components/repos/EnrichedRepos.tsx";
import { EnrichedStarred } from "@/routes/_dashboard/$user/enriched/-components/starred/EnrichedStarred.tsx";
import { useLiveQuery } from "@tanstack/react-db";
import { getRouteApi } from "@tanstack/react-router";
import { Activity, startTransition } from "react";

type EnrichedTab = (typeof enrichedTabs)[number];

/**
 * Tab panels sit under React `Activity`, which tears down child Effects when
 * hidden. Own SSE + live-query subscriptions here so tab switches stay snappy.
 */
export function EnrichedPage() {
  const { useSearch, useNavigate } = getRouteApi(enrichedRouteID);
  const search = useSearch();
  const tab = (search.tab ?? "starred") as EnrichedTab;
  const navigate = useNavigate();

  const starredActivity = useEmbedActivitySse();
  const reposActivity = useUserReposEmbedActivitySse();

  const starredList = useLiveQuery((query) =>
    query.from({ enriched: enrichStarredReposCollection }),
  );
  const reposList = useLiveQuery((query) =>
    query.from({ enriched: enrichUserReposCollection }),
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        startTransition(() => {
          void navigate({
            search: () => ({
              tab: next as EnrichedTab,
              // Shared URL search — clear so the other tab does not inherit `q`
              // (cold Gemma search) or a stale page number.
              q: undefined,
              page: undefined,
            }),
            replace: true,
          });
        });
      }}
      className="h-full w-full"
    >
      <TabsList className="w-full">
        {enrichedTabs.map((value) => (
          <TabsTrigger key={value} value={value}>
            {value}
          </TabsTrigger>
        ))}
      </TabsList>
      <Activity mode={tab === "starred" ? "visible" : "hidden"}>
        <EnrichedStarred
          status={starredActivity.status}
          live={starredActivity.live}
          allRows={starredList.data ?? []}
          listLoading={starredList.isLoading}
        />
      </Activity>
      <Activity mode={tab === "repos" ? "visible" : "hidden"}>
        <EnrichedRepos
          status={reposActivity.status}
          live={reposActivity.live}
          allRows={reposList.data ?? []}
          listLoading={reposList.isLoading}
        />
      </Activity>
    </Tabs>
  );
}
