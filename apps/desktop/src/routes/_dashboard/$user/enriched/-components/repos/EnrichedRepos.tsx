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
  type EnrichedUserRepoRow,
} from "@/data-access-layer/enriched/repos-enriched-collection.ts";
import type { UserRepoEmbedActivityStatus } from "@/elysia/routes/enrich/repos/helpers/embed-activity.ts";
import { getElysiaTreaty } from "@/elysia/treaty";
import { treatyErrorMessage } from "@/elysia/treaty-error";
import { enrichedRouteID } from "@/routes/_dashboard/$user/enriched/-components/constants.ts";
import { ReposEmbedDialog } from "@/routes/_dashboard/$user/enriched/-components/repos/ReposEmbedDialog.tsx";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { FolderGit2, Loader, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";

const routeApi = getRouteApi(enrichedRouteID);

function EnrichedReposEmpty({
  login,
  onEmbed,
}: {
  login: string;
  onEmbed: () => void;
}) {
  return (
    <Empty className="border border-dashed" data-test="enriched-repos-empty">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderGit2 />
        </EmptyMedia>
        <EmptyTitle>No embedded repos yet</EmptyTitle>
        <EmptyDescription>
          Crawl @{login}’s owned repos (top 100 by stars) and embed each locally with
          EmbeddingGemma.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button data-test="enriched-repos-empty-embed" onClick={onEmbed}>
          <Sparkles />
          Embed repos
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function EnrichedReposSearchEmpty({ query }: { query: string }) {
  return (
    <Empty className="border border-dashed" data-test="enriched-repos-search-empty">
      <EmptyHeader>
        <EmptyTitle>No matches</EmptyTitle>
        <EmptyDescription>
          Nothing in the enriched repos corpus matches “{query}”.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function EnrichedReposList({ items }: { items: EnrichedUserRepoRow[] }) {
  return (
    <ul
      className="divide-y divide-border rounded-lg border border-border"
      data-test="enriched-repos-list"
    >
      {items.map((item) => (
        <li key={item.id} className="hover:bg-muted/50 transition-colors">
          <Link
            to="/$user/repos/$repo"
            params={{ user: item.owner, repo: item.name }}
            preload="intent"
            className="flex flex-col gap-1 p-4"
            aria-label={`Open ${item.owner}/${item.name} details`}
            data-test={`enriched-repo-${item.owner}-${item.name}`}
          >
            <p className="text-sm font-medium">{`${item.owner}/${item.name}`}</p>
            {item.description ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ReposListBody(props: {
  login: string;
  searching: boolean;
  q: string;
  isLoading: boolean;
  listEmpty: boolean;
  searchError: Error | null;
  rows: EnrichedUserRepoRow[];
  items: EnrichedUserRepoRow[];
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
    return <EnrichedReposEmpty login={props.login} onEmbed={props.onEmbed} />;
  }

  if (props.searching && props.searchError) {
    return (
      <pre className="text-destructive whitespace-pre-wrap text-sm">
        {props.searchError.message}
      </pre>
    );
  }

  if (props.rows.length === 0) {
    return <EnrichedReposSearchEmpty query={props.q} />;
  }

  return <EnrichedReposList items={props.items} />;
}

export function EnrichedRepos({
  status,
  live,
  allRows,
  listLoading,
}: {
  status: UserRepoEmbedActivityStatus | null;
  live: boolean;
  allRows: EnrichedUserRepoRow[];
  listLoading: boolean;
}) {
  const params = routeApi.useParams();
  const search = routeApi.useSearch();
  const login = params.user;
  const q = (search.q ?? "").trim();
  const page = search.page ?? 1;
  const [dialogOpen, setDialogOpen] = useState(false);

  const semantic = useQuery({
    queryKey: ["enriched-repos-search", q],
    enabled: q.length > 0,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const { data, error } = await getElysiaTreaty().enrich.repos.search.get({
        query: { q },
      });
      if (error) throw new Error(treatyErrorMessage(error));
      return (data ?? []) as EnrichedUserRepoRow[];
    },
  });

  const searching = q.length > 0;
  const rows = searching ? (semantic.data ?? []) : allRows;
  const isLoading = searching ? semantic.isLoading && !semantic.data : listLoading;
  const { items, pagination } = paginateItems(rows, page, ADMIN_LIST_PER_PAGE);

  const actions = (
    <Button
      data-test="enriched-repos-embed"
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
          Embed repos
        </>
      )}
    </Button>
  );

  return (
    <>
      <PaginatedListScaffold
        routeID={enrichedRouteID}
        title={`Repos · ${login}`}
        description={`Local corpus of @${login}’s owned repos with embeddings`}
        searchPlaceholder="Try natural language — e.g. react native camera…"
        actions={actions}
        totalPages={isLoading ? 0 : pagination.totalPages}
        searchDebounceMs={600}
        dataTest="enriched-repos-page"
      >
        <ReposListBody
          login={login}
          searching={searching}
          q={q}
          isLoading={isLoading}
          listEmpty={allRows.length === 0}
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
      <ReposEmbedDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        login={login}
        status={status}
        live={live}
      />
    </>
  );
}
