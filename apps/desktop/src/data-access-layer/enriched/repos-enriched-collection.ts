import { getQueryClient } from "@/lib/tanstack/query/queryclient";
import type { ElysiaTreaty } from "@/elysia/treaty";
import { getElysiaTreaty } from "@/elysia/treaty";
import { treatyErrorMessage } from "@/elysia/treaty-error";
import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

type AwaitedData<T> = NonNullable<Awaited<T> extends { data: infer D } ? D : never>;

/** One row from `GET /api/elysia/enrich/repos/list` (enrichment output / repo SoT). */
export type EnrichedUserRepoRow = AwaitedData<
  ReturnType<ElysiaTreaty["enrich"]["repos"]["list"]["get"]>
>[number];

export const enrichedUserReposQueryKey = ["enriched-user-repos"] as const;

/**
 * TanStack DB collection of enriched user-owned repos (one row per owner/name).
 * Snapshot from `/enrich/repos/list`; SSE upserts + 1m invalidate keep it fresh.
 */
export const enrichUserReposCollection = createCollection(
  queryCollectionOptions({
    id: "enriched-user-repos",
    queryKey: enrichedUserReposQueryKey,
    queryClient: getQueryClient(),
    getKey: (item: EnrichedUserRepoRow) => item.id,
    queryFn: async () => {
      const { data, error } = await getElysiaTreaty().enrich.repos.list.get();
      if (error) throw new Error(treatyErrorMessage(error));
      return data ?? [];
    },
    onDelete: async ({ transaction }) => {
      for (const mutation of transaction.mutations) {
        const { owner, name } = mutation.original;
        const { error } = await getElysiaTreaty().enrich.repos({ owner })({ name }).delete();
        if (error) throw new Error(treatyErrorMessage(error));
      }
    },
  }),
);

/** Upsert one enriched row from SSE (no embedding vector). */
export function upsertEnrichedUserRepo(row: EnrichedUserRepoRow) {
  const write = () => {
    try {
      enrichUserReposCollection.utils.writeUpsert(row);
    } catch {
      getQueryClient().setQueryData<EnrichedUserRepoRow[]>(enrichedUserReposQueryKey, (prev) => {
        const list = prev ?? [];
        const index = list.findIndex((item) => item.id === row.id);
        if (index === -1) return [...list, row];
        const next = list.slice();
        next[index] = row;
        return next;
      });
    }
  };

  if (enrichUserReposCollection.isReady()) {
    write();
    return;
  }

  enrichUserReposCollection.onFirstReady(write);
}

/** Full list refetch (also used on a 1-minute timer). */
export function invalidateEnrichedUserRepos() {
  return getQueryClient().invalidateQueries({ queryKey: enrichedUserReposQueryKey });
}
