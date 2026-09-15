import { PaginatedListScaffold } from "@/components/pagination/PaginatedListScaffold.tsx";
import { enrichedCollection } from "@/data-access-layer/enriched/list-enriched-collection.ts";
import { useLiveQuery } from "@tanstack/react-db";
import { Loader } from "lucide-react";

const routeID = "/_dashboard/$user/enriched/" as const;
export function EnrichedPage() {
  const { data, isLoading } = useLiveQuery((q) => q.from({ enriched: enrichedCollection }));

  if (isLoading)
    return (
      <PaginatedListScaffold
        routeID={routeID}
        title="Enriched"
        description="Enriched"
        searchPlaceholder="Search enrched">
        <div
          className="h-full minh-screen w-full flex justify-center items-center gap-6"
          data-test="enriched-page">
          <Loader className="h-4 w-4 animate-spin" />
        </div>
      </PaginatedListScaffold>
    );

  return (
    <PaginatedListScaffold
      routeID={routeID}
      title="Enriched"
      description="Enriched"
      searchPlaceholder="Search enrched">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6" data-test="enriched-page">
        <ul>
          {data?.map((item) => (
            <li key={item.id}>
              <div className="hover:bg-muted/50 transition-colors">
                <div className="p-4">
                  <p className="text-sm font-medium">{`${item.owner}/${item.name}`}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </PaginatedListScaffold>
  );
}
