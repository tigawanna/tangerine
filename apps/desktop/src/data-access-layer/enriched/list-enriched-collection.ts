import { getQueryClient } from "@/lib/tanstack/query/queryclient";
import type { ElysiaTreaty } from "@/server/elysia/treaty";
import { getElysiaTreaty } from "@/server/elysia/treaty";
import { treatyErrorMessage } from "@/server/elysia/treaty-error";
import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

type AwaitedData<T> = NonNullable<Awaited<T> extends { data: infer D } ? D : never>;

/** One row from `GET /api/elysia/enrich/list` (enrichment output / repo SoT). */
export type EnrichedRepoRow = AwaitedData<ReturnType<ElysiaTreaty["enrich"]["list"]["get"]>>[number];

/**
 * TanStack DB collection of enriched repos (one row per owner/name).
 * Snapshot from `/enrich/list`; later CDC/SSE can writeUpsert / writeDelete.
 */
export const enrichedCollection = createCollection(
  queryCollectionOptions({
    id: "enriched-repos",
    queryKey: ["enriched-repos"],
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
