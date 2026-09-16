import { getQueryClient } from "@/lib/tanstack/query/queryclient";
import type { ElysiaTreaty } from "@/server/elysia/treaty";
import { getElysiaTreaty } from "@/server/elysia/treaty";
import { treatyErrorMessage } from "@/server/elysia/treaty-error";
import { createCollection } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

type AwaitedData<T> = NonNullable<Awaited<T> extends { data: infer D } ? D : never>;

/** One row from `GET /api/elysia/hello`. */
export type HelloRow = AwaitedData<ReturnType<ElysiaTreaty["hello"]["get"]>>[number];

export const helloQueryKey = ["hello"] as const;

/**
 * TanStack DB collection for hello demo messages.
 * Initial snapshot from GET /hello; live rows via SSE (`useHelloSse`).
 */
export const helloCollection = createCollection(
  queryCollectionOptions({
    id: "hello",
    queryKey: helloQueryKey,
    queryClient: getQueryClient(),
    getKey: (item: HelloRow) => item.id,
    queryFn: async () => {
      const { data, error } = await getElysiaTreaty().hello.get();
      if (error) throw new Error(treatyErrorMessage(error));
      return data ?? [];
    },
  }),
);

/** Append one live SSE message into the hello collection. */
export function appendHelloMessage(message: string) {
  const row: HelloRow = { id: crypto.randomUUID(), message };

  const write = () => {
    try {
      helloCollection.utils.writeInsert(row);
    } catch {
      getQueryClient().setQueryData<HelloRow[]>(helloQueryKey, (prev) => [...(prev ?? []), row]);
    }
  };

  if (helloCollection.isReady()) {
    write();
    return;
  }

  helloCollection.onFirstReady(write);
}
