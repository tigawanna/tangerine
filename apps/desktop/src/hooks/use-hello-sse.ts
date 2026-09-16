import { helloCollection } from "@/data-access-layer/enriched/hello-collection.ts";
import { getElysiaTreaty } from "@/server/elysia/treaty.ts";
import { useEffect } from "react";

/** Stream POST /hello emits into the hello collection via SSE. */
export function useHelloSse() {
  useEffect(() => {
    const path = getElysiaTreaty().hello.sse["~path"];
    const source = new EventSource(path);

    source.onmessage = (event) => {
      helloCollection.writeInsert({
        id: crypto.randomUUID(),
        message: event.data,
      });
    };

    source.onerror = () => {
      if (source.readyState !== EventSource.CONNECTING) {
        source.close();
      }
    };

    return () => {
      source.close();
    };
  }, []);
}
