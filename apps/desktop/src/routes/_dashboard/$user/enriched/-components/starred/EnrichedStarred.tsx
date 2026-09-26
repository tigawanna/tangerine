import { PaginatedListScaffold } from "@/components/pagination/PaginatedListScaffold.tsx";
import { paginateItems } from "@/components/pagination/paginate-items.ts";
import { ADMIN_LIST_PER_PAGE } from "@/components/pagination/constants.ts";
import { Button } from "@/components/ui/button.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  enrichStarredReposCollection,
  type EnrichedRepoRow,
} from "@/data-access-layer/enriched/starred-enriched-collection.ts";
import { getElysiaTreaty } from "@/elysia/treaty";
import { treatyErrorMessage } from "@/elysia/treaty-error";
import { useEmbedActivitySse } from "@/hooks/use-embed-activity-sse.ts";
import { enrichedRouteID } from "@/routes/_dashboard/$user/enriched/-components/constants.ts";
import { StarredEmbedDialog } from "@/routes/_dashboard/$user/enriched/-components/starred/StarredEmbedDialog.tsx";
import { useLiveQuery } from "@tanstack/react-db";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Loader, Sparkles, Star } from "lucide-react";
import { useState, type ReactNode } from "react";

const routeApi = getRouteApi(enrichedRouteID);

function EnrichedStarredEmpty({ onEmbed }: { onEmbed: () => void }) {
  return (
    <Empty className="border border-dashed" data-test="enriched-starred-empty">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Star />
        </EmptyMedia>
        <EmptyTitle>No embedded repos yet</EmptyTitle>
        <EmptyDescription>
          Crawl your starred list and embed each repo locally with EmbeddingGemma.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button data-test="enriched-starred-empty-embed" onClick={onEmbed}>
          <Sparkles />
          Embed starred
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function EnrichedStarredSearchEmpty({ query }: { query: string }) {
  return (
    <Empty className="border border-dashed" data-test="enriched-starred-search-empty">
      <EmptyHeader>
        <EmptyTitle>No matches</EmptyTitle>
        <EmptyDescription>
          Nothing in your enriched starred corpus matches “{query}”.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function EnrichedStarredList({ items }: { items: EnrichedRepoRow[] }) {
  return (
    <ul
      className="divide-y divide-border rounded-lg border border-border"
      data-test="enriched-starred-list"
    >
      {items.map((item) => (
        <li key={item.id} className="hover:bg-muted/50 transition-colors">
          <div className="flex flex-col gap-1 p-4">
            <p className="text-sm font-medium">{`${item.owner}/${item.name}`}</p>
            {item.description ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function StarredListBody(props: {
  searching: boolean;
  q: string;
  isLoading: boolean;
  listEmpty: boolean;
  searchError: Error | null;
  rows: EnrichedRepoRow[];
  items: EnrichedRepoRow[];
  onEmbed: () => void;
}): ReactNode {
  if (props.isLoading) {
    return (
      <div className="flex min-h-40 w-full items-center justify-center gap-2">
        <Loader className="size-4 animate-spin" />
        {props.searching ? (
          <span className="text-muted-foreground text-sm">Embedding query…</span>
        ) : null}
      </div>
    );
  }

  if (!props.searching && props.listEmpty) {
    return <EnrichedStarredEmpty onEmbed={props.onEmbed} />;
  }

  if (props.searching && props.searchError) {
    return (
      <pre className="text-destructive whitespace-pre-wrap text-sm">
        {props.searchError.message}
      </pre>
    );
  }

  if (props.rows.length === 0) {
    return <EnrichedStarredSearchEmpty query={props.q} />;
  }

  return <EnrichedStarredList items={props.items} />;
}

export function EnrichedStarred() {
  const search = routeApi.useSearch();
  const q = (search.q ?? "").trim();
  const page = search.page ?? 1;
  const [dialogOpen, setDialogOpen] = useState(false);

  // Keep SSE + collection upserts alive while this tab is mounted.
  const { status, live } = useEmbedActivitySse();

  const { data: allRows, isLoading: listLoading } = useLiveQuery((query) =>
    query.from({ enriched: enrichStarredReposCollection }),
  );

  const semantic = useQuery({
    queryKey: ["enriched-starred-search", q],
    enabled: q.length > 0,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const { data, error } = await getElysiaTreaty().enrich.starred.search.get({
        query: { q },
      });
      if (error) throw new Error(treatyErrorMessage(error));
      return (data ?? []) as EnrichedRepoRow[];
    },
  });

  const searching = q.length > 0;
  const rows = searching ? (semantic.data ?? []) : (allRows ?? []);
  // Keep showing prior results while a new embed-search is in flight (avoids remount thrash).
  const isLoading = searching
    ? semantic.isLoading && !semantic.data
    : listLoading;
  const { items, pagination } = paginateItems(rows, page, ADMIN_LIST_PER_PAGE);

  const actions = (
    <Button
      data-test="enriched-starred-embed"
      variant={live ? "secondary" : "default"}
      onClick={() => setDialogOpen(true)}
    >
      {live ? (
        <>
          <Loader className="animate-spin" />
          Embedding…
        </>
      ) : (
        <>
          <Sparkles />
          Embed starred
        </>
      )}
    </Button>
  );

  return (
    <>
      <PaginatedListScaffold
        routeID={enrichedRouteID}
        title="Starred"
        description="Local corpus of starred repos with embeddings"
        searchPlaceholder="Semantic search enriched…"
        actions={actions}
        totalPages={isLoading ? 0 : pagination.totalPages}
        searchDebounceMs={600}
        dataTest="enriched-starred-page"
      >
        <StarredListBody
          searching={searching}
          q={q}
          isLoading={isLoading}
          listEmpty={(allRows?.length ?? 0) === 0}
          searchError={
            searching && semantic.isError
              ? semantic.error instanceof Error
                ? semantic.error
                : new Error(String(semantic.error))
              : null
          }
          rows={rows}
          items={items}
          onEmbed={() => setDialogOpen(true)}
        />
      </PaginatedListScaffold>
      <StarredEmbedDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        status={status}
        live={live}
      />
    </>
  );
}
