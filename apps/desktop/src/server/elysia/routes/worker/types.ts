import type { ElysiaTreaty } from "@/server/elysia/treaty";

type AwaitedData<T> = NonNullable<Awaited<T> extends { data: infer D } ? D : never>;

/** Status payload from `GET /api/elysia/worker/demo-batch`. */
export type DemoBatchStatus = AwaitedData<
  ReturnType<ElysiaTreaty["worker"]["demo-batch"]["get"]>
>;
