import { getQueryClient } from "@/lib/tanstack/query/queryclient";
import type { ElysiaTreaty } from "@/server/elysia/treaty";
import { getElysiaTreaty } from "@/server/elysia/treaty";
import { treatyErrorMessage } from "@/server/elysia/treaty-error";
import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

type AwaitedData<T> = NonNullable<Awaited<T> extends { data: infer D } ? D : never>;

/** One row from `GET /api/elysia/hello`. */
export type HelloRow = AwaitedData<ReturnType<ElysiaTreaty["hello"]["get"]>>[number];

/**
 * TanStack DB collection for hello demo messages.
 * Initial snapshot from GET /hello; live rows via SSE (`useHelloSse`).
 */
export const helloCollection = createCollection(
  queryCollectionOptions({
    id: "hello",
    queryKey: ["hello"],
    syncMode: "on-demand",
    queryClient: getQueryClient(),
    getKey: (item: HelloRow) => item.id,
    queryFn: async () => {
      const { data, error } = await getElysiaTreaty().hello.get();
      if (error) throw new Error(treatyErrorMessage(error));
      return data ?? [];
    },
  }),
);
