import { createWorkerStore } from "@/lib/worker/store.ts";

export const starredRepoEmbedStore = createWorkerStore({ name: "starred-repo-embed" });
await starredRepoEmbedStore.connect();
