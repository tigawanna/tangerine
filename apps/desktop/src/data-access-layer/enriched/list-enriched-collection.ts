import { getQueryClient } from "@/lib/tanstack/query/queryclient";
import type { ElysiaTreaty } from "@/server/elysia/treaty";
import { getElysiaTreaty } from "@/server/elysia/treaty";
import { treatyErrorMessage } from "@/server/elysia/treaty-error";
import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

type AwaitedData<T> = NonNullable<Awaited<T> extends { data: infer D } ? D : never>;

/** One row from `GET /api/elysia/enrich/list` (enrichment output / repo SoT). */
export type EnrichedRepoRow = AwaitedData<ReturnType<ElysiaTreaty["enrich"]["list"]["get"]>>[number];

export const enrichedReposQueryKey = ["enriched-repos"] as const;

/**
 * TanStack DB collection of enriched repos (one row per owner/name).
 * Snapshot from `/enrich/list`; SSE upserts + 1m invalidate keep it fresh.
 */
export const enrichedCollection = createCollection(
  queryCollectionOptions({
    id: "enriched-repos",
    queryKey: enrichedReposQueryKey,
    queryClient: getQueryClient(),
    getKey: (item: EnrichedRepoRow) => item.id,
    queryFn: async () => {
      const { data, error } = await getElysiaTreaty().enrich.list.get();
      if (error) throw new Error(treatyErrorMessage(error));
      return data ?? [];
    },
    onDelete: async ({ transaction }) => {
      for (const mutation of transaction.mutations) {
        const { owner, name } = mutation.original;
        const { error } = await getElysiaTreaty().enrich({ owner })({ name }).delete();
        if (error) throw new Error(treatyErrorMessage(error));
      }
    },
  }),
);

/** Upsert one enriched row from SSE (no embedding vector). */
export function upsertEnrichedRepo(row: EnrichedRepoRow) {
  const write = () => {
    try {
      enrichedCollection.utils.writeUpsert(row);
    } catch {
      getQueryClient().setQueryData<EnrichedRepoRow[]>(enrichedReposQueryKey, (prev) => {
        const list = prev ?? [];
        const index = list.findIndex((item) => item.id === row.id);
        if (index === -1) return [...list, row];
        const next = list.slice();
        next[index] = row;
        return next;
      });
    }
  };

  if (enrichedCollection.isReady()) {
    write();
    return;
  }

  enrichedCollection.onFirstReady(write);
}

/** Full list refetch (also used on a 1-minute timer). */
export function invalidateEnrichedRepos() {
  return getQueryClient().invalidateQueries({ queryKey: enrichedReposQueryKey });
}
