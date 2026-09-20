import type { ElysiaTreaty } from "@/elysia/treaty";

type AwaitedData<T> = NonNullable<Awaited<T> extends { data: infer D } ? D : never>;

export type GemmaModelSettingsResult = AwaitedData<
  ReturnType<ElysiaTreaty["embedding"]["settings"]["get"]>
>;
export type GemmaLoadStatusResult = AwaitedData<
  ReturnType<ElysiaTreaty["embedding"]["models"]["load"]["get"]>
>;
export type EmbeddingBootstrapStatus = AwaitedData<
  ReturnType<ElysiaTreaty["embedding"]["bootstrap"]["get"]>
>;
export type EmbedTextResult = AwaitedData<ReturnType<ElysiaTreaty["embedding"]["embed"]["post"]>>;

export type GemmaDtypeId = GemmaModelSettingsResult["activeDtype"];
