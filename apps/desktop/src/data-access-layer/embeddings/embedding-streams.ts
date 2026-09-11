import { sleep } from "@/lib/sse";
import { createServerFn } from "@tanstack/react-start";
import { getEmbeddingBootstrapStatus, type EmbeddingBootstrapStatus } from "./embedding-bootstrap";

function isBootstrapLive(status: EmbeddingBootstrapStatus): boolean {
  return (
    status.overall.phase === "running" ||
    status.runtime.phase === "downloading" ||
    status.model.phase === "downloading"
  );
}

/**
 * Typed stream of embedding bootstrap snapshots.
 * Yields immediately, then ~1s while downloads are live, then one final frame.
 */
export const watchEmbeddingBootstrap = createServerFn({ method: "GET" }).handler(
  async function* (): AsyncGenerator<EmbeddingBootstrapStatus> {
    let previous: string | null = null;
    for (;;) {
      const status = await getEmbeddingBootstrapStatus();
      const serialized = JSON.stringify(status);
      if (serialized !== previous) {
        previous = serialized;
        yield status;
      }
      if (!isBootstrapLive(status)) break;
      await sleep(1000);
    }
  },
);

/**
 * Typed stream of Gemma load/download progress (dtype switch / model fetch).
 */
export const watchGemmaLoadStatus = createServerFn({ method: "GET" }).handler(async function* () {
  let previous: string | null = null;
  for (;;) {
    const { getGemmaLoadSnapshot } = await import("@repo/gemma-embedding/server");
    const status = getGemmaLoadSnapshot();
    const serialized = JSON.stringify(status);
    if (serialized !== previous) {
      previous = serialized;
      yield status;
    }
    if (status.phase !== "loading") break;
    await sleep(1000);
  }
});
