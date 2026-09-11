import { Button } from "@/components/ui/button";
import { getElysiaTreaty } from "@/server/elysia/treaty";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const labRoute = getRouteApi("/_dashboard/$user/elysia/");

type TickPayload = { n: number; at: string };

/**
 * Port experiment: Elysia GET + SSE tick stream via Eden Treaty.
 * Next: model list / download / load against the same mount.
 */
export function ElysiaLabPage() {
  const { user } = labRoute.useParams();
  const [streaming, setStreaming] = useState(false);
  const [tick, setTick] = useState<TickPayload | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const helloQuery = useQuery({
    queryKey: ["elysia", "hello"],
    queryFn: async () => {
      const { data, error } = await getElysiaTreaty().hello.get();
      if (error) throw new Error(String(error.value ?? error.status));
      return data;
    },
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function startTick() {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    setStreaming(true);
    setStreamError(null);
    setTick(null);

    try {
      const { data, error } = await getElysiaTreaty().tick.get({
        fetch: { signal: abort.signal },
      });
      if (error) throw new Error(String(error.value ?? error.status));
      if (!data) throw new Error("No tick stream");

      for await (const chunk of data) {
        if (abort.signal.aborted) break;
        const payload = unwrapTick(chunk);
        if (payload) setTick(payload);
      }
    } catch (caught) {
      if (abort.signal.aborted) return;
      setStreamError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      if (abortRef.current === abort) {
        setStreaming(false);
        abortRef.current = null;
      }
    }
  }

  function stopTick() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FlaskConical className="size-4" aria-hidden />
          <span className="text-sm">Elysia lab · {user}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Embedding API experiment</h1>
        <p className="text-sm text-muted-foreground">
          Mounted under <code className="text-xs">/api/elysia</code> inside TanStack Start. Old
          server-fn embeddings stay untouched.
        </p>
      </header>

      <section className="flex flex-col gap-3" data-test="elysia-hello">
        <h2 className="text-sm font-medium">GET /hello</h2>
        {helloQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : helloQuery.isError ? (
          <p className="text-sm text-destructive">
            {helloQuery.error instanceof Error ? helloQuery.error.message : "Request failed"}
          </p>
        ) : (
          <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
            {JSON.stringify(helloQuery.data, null, 2)}
          </pre>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          data-test="elysia-hello-refresh"
          onClick={() => void helloQuery.refetch()}
        >
          Refresh
        </Button>
      </section>

      <section className="flex flex-col gap-3" data-test="elysia-tick">
        <h2 className="text-sm font-medium">SSE /tick</h2>
        <p className="text-sm text-muted-foreground">
          Eden Treaty consumes Elysia <code className="text-xs">sse()</code> as an async iterator —
          one number per second.
        </p>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-4xl tabular-nums tracking-tight" data-test="elysia-tick-n">
            {tick?.n ?? "—"}
          </span>
          {tick ? (
            <span className="text-xs text-muted-foreground" data-test="elysia-tick-at">
              {tick.at}
            </span>
          ) : null}
        </div>
        {streamError ? <p className="text-sm text-destructive">{streamError}</p> : null}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            data-test="elysia-tick-start"
            disabled={streaming}
            onClick={() => void startTick()}
          >
            {streaming ? "Streaming…" : "Start stream"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-test="elysia-tick-stop"
            disabled={!streaming}
            onClick={stopTick}
          >
            Stop
          </Button>
        </div>
      </section>
    </div>
  );
}

/** Eden may yield `{ event, data }` or the payload directly depending on adapter. */
function unwrapTick(chunk: unknown): TickPayload | null {
  if (!chunk || typeof chunk !== "object") return null;
  const record = chunk as Record<string, unknown>;
  if (record.data && typeof record.data === "object") {
    return asTickPayload(record.data as Record<string, unknown>);
  }
  return asTickPayload(record);
}

function asTickPayload(record: Record<string, unknown>): TickPayload | null {
  if (typeof record.n !== "number") return null;
  const at = record.at;
  if (typeof at === "string") return { n: record.n, at };
  if (at instanceof Date) return { n: record.n, at: at.toISOString() };
  return null;
}
