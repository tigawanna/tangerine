import { appendHelloMessage, helloCollection } from "@/data-access-layer/enriched/hello-collection.ts";
import { getElysiaTreaty } from "@/server/elysia/treaty.ts";
import { useEffect } from "react";

/** Stream POST /hello emits into the hello collection via SSE. */
export function useHelloSse() {
  useEffect(() => {
    let source: EventSource | null = null;
    let cancelled = false;

    const connect = () => {
      const path = getElysiaTreaty().hello.sse["~path"];
      source = new EventSource(path);
      source.onmessage = (event) => appendHelloMessage(event.data);
      source.onerror = () => {
        if (source && source.readyState !== EventSource.CONNECTING) {
          source.close();
        }
      };
    };

    const disconnect = () => {
      cancelled = true;
      source?.close();
    };

    if (helloCollection.isReady()) {
      connect();
    } else {
      const unsubscribe = helloCollection.onFirstReady(() => {
        if (cancelled) return;
        connect();
      });
      return () => {
        unsubscribe();
        disconnect();
      };
    }

    return disconnect;
  }, []);
}
