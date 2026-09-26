import { createWorkerStore } from "@/lib/worker/store.ts";

export const userRepoEmbedStore = createWorkerStore({ name: "user-repo-embed" });
await userRepoEmbedStore.connect();
