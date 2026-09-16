import { PaginatedListScaffold } from "@/components/pagination/PaginatedListScaffold.tsx";
import { enrichStarredReposCollection } from "@/data-access-layer/enriched/list-enriched-collection.ts";
import { enrichedRouteID } from "@/routes/_dashboard/$user/enriched/-components/constants.ts";
import { useLiveQuery } from "@tanstack/react-db";
import { Loader } from "lucide-react";

export function EnrichedStarred() {
  const { data, isLoading } = useLiveQuery((q) =>
    q.from({ enriched: enrichStarredReposCollection }),
  );

  if (isLoading) {
    return (
      <PaginatedListScaffold
        routeID={enrichedRouteID}
        title="Enriched"
        description="Local corpus of starred repos with embeddings"
        searchPlaceholder="Search enriched">
        <div
          className="flex min-h-screen w-full items-center justify-center gap-6"
          data-test="enriched-page">
          <Loader className="h-4 w-4 animate-spin" />
        </div>
      </PaginatedListScaffold>
    );
  }

  return (
    <PaginatedListScaffold
      routeID={enrichedRouteID}
      title="Enriched"
      description="Local corpus of starred repos with embeddings"
      searchPlaceholder="Search enriched">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6" data-test="enriched-page">
        <ul className="divide-y divide-border rounded-lg border border-border">
          {(data?.length ?? 0) === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">No embedded repos yet.</li>
          ) : (
            data?.map((item) => (
              <li key={item.id} className="hover:bg-muted/50 transition-colors">
                <div className="flex flex-col gap-1 p-4">
                  <p className="text-sm font-medium">{`${item.owner}/${item.name}`}</p>
                  {item.description ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </PaginatedListScaffold>
  );
}
