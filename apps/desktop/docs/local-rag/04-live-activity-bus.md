# Chapter 4: Live activity bus (Elysia SSE + pub/sub powered by nodejs event emitter)

[Series index](./README.md) · Prev: [Chapter 3](./03-worker-engine.md) · Next: [Chapter 5: Query path](./05-query-path.md)

## Why

The chapter 3 worker runs for minutes. The UI should show "embedding facebook/react", "42 done, 1 failed", and new rows appearing in the list as they land, without polling.

The shape is plain pub/sub: something **publishes** an event, and every open browser connection **listens** over [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events). A small in-process bus sits in the middle.

```text
 POST /chat  ----+
                 |  publish(topic, event)
 worker    ------+----------------------> [ pubSub (EventEmitter) ]
                                                 |
                                                 |  listen(topic)  one per open connection
                                                 v
                                      GET /chat/sse  (async generator)
                                                 |
                                                 v  yield sse({ data })
                                          EventSource in React
                                                 |
                                                 v
                                        TanStack Query cache -> UI
```

## The bus

[`src/lib/pub-sub/client.ts`](../../src/lib/pub-sub/client.ts) wraps a Node `EventEmitter`. The useful part is `listen()`: Node's [`events.on()`](https://nodejs.org/api/events.html#eventsonemitter-eventname-options) turns an emitter into an async iterable, and passing an `AbortSignal` ends the loop and removes the listener.

```ts
export class PubSub {
  readonly #emitter = new EventEmitter().setMaxListeners(100);

  publish(topic: PubSubTopic, message: unknown): void {
    this.#emitter.emit(topic, message);
  }

  async *listen<T = unknown>(topic: PubSubTopic, options?: { signal?: AbortSignal }) {
    for await (const [message] of on(this.#emitter, topic, options)) {
      yield message as T;
    }
  }
}
```

It's a process-wide singleton pinned on `globalThis`, so Vite HMR re-evaluating the module can't split routes and workers onto two different emitters:

```ts
export const pubSub: PubSub = (() => {
  const g = globalThis as GlobalWithPubSub;
  g[GLOBAL_KEY] ??= new PubSub();
  return g[GLOBAL_KEY];
})();
```

Topics are a const map, so a typo is a type error ([`topics.ts`](../../src/lib/pub-sub/topics.ts)):

```ts
export const PUB_SUB_TOPICS = {
  HELLO_MESSAGE: "hello-message",
  CHAT_MESSAGE: "chat-message",
  REPO_EMBED_PROGRESS: "repo-embed-progress",
  USER_REPO_EMBED_PROGRESS: "user-repo-embed-progress",
} as const;
```

## Worked example: chat

The scratchpad chat is the smallest complete version of the pattern: a list you can add to and delete from, synced live across every open window.

### 1. The event type

One discriminated union describes everything the stream can send ([`src/data-access-layer/chat/chat.ts`](../../src/data-access-layer/chat/chat.ts)). The row type is inferred from the route through Eden, so it can't drift:

```ts
export type ChatRow = AwaitedData<ReturnType<ElysiaTreaty["chat"]["get"]>>[number];

export type ChatSseEvent =
  | { type: "created"; row: ChatRow }
  | { type: "deleted"; id: number };
```

### 2. The route: write, then publish

[`src/elysia/routes/chat/index.ts`](../../src/elysia/routes/chat/index.ts). Mutations write to PGlite first and publish only what actually happened:

```ts
export const chatRoute = new Elysia({ prefix: "/chat" })
  .get("/", () => db.query.chat.findMany({ orderBy: (row, { desc }) => [desc(row.createdAt)] }))
  .post(
    "/",
    async ({ body }) => {
      const [row] = await db.insert(chat).values({ message: body.message }).returning();
      if (row) pubSub.publish(PUB_SUB_TOPICS.CHAT_MESSAGE, { type: "created", row } satisfies ChatSseEvent);
      return row;
    },
    { body: t.Object({ message: t.String({ minLength: 1 }) }) },
  )
  .delete(
    "/:id",
    async ({ params }) => {
      await db.delete(chat).where(eq(chat.id, params.id));
      pubSub.publish(PUB_SUB_TOPICS.CHAT_MESSAGE, { type: "deleted", id: params.id } satisfies ChatSseEvent);
      return { data: { message: "Chat deleted" }, error: null };
    },
    { params: t.Object({ id: t.Numeric() }) },
  )
```

### 3. The stream: an async generator

With Elysia, an SSE endpoint is a generator that yields `sse(...)` frames. Elysia sets the `text/event-stream` headers and [stops the generator when the client disconnects](https://elysiajs.com/essential/handler#server-sent-events-sse). Passing `request.signal` to `listen()` also removes the emitter listener at that moment.

```ts
  .get("/sse", async function* ({ request }) {
    for await (const event of pubSub.listen<ChatSseEvent>(PUB_SUB_TOPICS.CHAT_MESSAGE, {
      signal: request.signal,
    })) {
      yield sse({ data: event });
    }
  });
```

That's the entire server side of live updates: no socket bookkeeping and no subscriber list.

### 4. The client: EventSource → query cache

A tiny generic helper parses JSON frames and returns an unsubscribe function ([`use-embedding-sse.ts`](../../src/hooks/use-embedding-sse.ts)):

```ts
export function subscribeSseJson<T>(url: string, handlers: { onMessage: (data: T) => void }): () => void {
  const source = new EventSource(url);
  source.onmessage = (event) => handlers.onMessage(JSON.parse(event.data));
  source.onerror = () => {
    if (source.readyState !== EventSource.CONNECTING) source.close();
  };
  return () => source.close();
}
```

The chat hook ([`use-chat-sse.ts`](../../src/hooks/use-chat-sse.ts)) applies each event straight to the TanStack Query cache, so the list re-renders without a refetch. The route path comes from Eden (`~path`), not a hardcoded string.

```ts
function applyChatSseEvent(event: ChatSseEvent) {
  getQueryClient().setQueryData<ChatRow[]>(chatQueryKey, (prev = []) => {
    if (event.type === "created") {
      return prev.some((row) => row.id === event.row.id) ? prev : [event.row, ...prev];
    }
    return prev.filter((row) => row.id !== event.id);
  });
}

export function useChatSse() {
  useEffect(() => {
    const path = getElysiaTreaty().chat.sse["~path"];
    return subscribeSseJson<ChatSseEvent>(path, { onMessage: applyChatSseEvent });
  }, []);
}
```

The `some(...)` check matters: the window that sent the message also receives its own `created` event, and this stops it from showing the row twice.

### 5. The component

The initial list comes from a normal query, and live changes come from the hook ([`Scratchpad.tsx`](../../src/routes/_dashboard/$user/scratchpad/-components/Scratchpad.tsx)):

```tsx
export function Scratchpad() {
  useChatSse();
  const { data, isLoading, error } = useQuery({ queryKey: chatQueryKey, queryFn: listChats });
  // ...render ChatInput + ChatList
}
```

The input's mutation just calls `createChat(message)`. It doesn't touch the cache, because the SSE event does that for every window, including this one.

## The same pattern for embedding progress

The chapter 3 worker publishes `{ status, row }` on `REPO_EMBED_PROGRESS` from `patchEmbedActivity()`. The stream route adds one thing: it **sends the current snapshot first**, so a window that opens mid-run starts from the real state instead of waiting for the next event ([`enrich/starred/index.ts`](../../src/elysia/routes/enrich/starred/index.ts)):

```ts
.get("/activity/events", async function* ({ request }) {
  yield sse({ data: { status: getEmbedActivityStatus(), row: null } });

  for await (const payload of pubSub.listen<EmbedActivitySsePayload>(
    PUB_SUB_TOPICS.REPO_EMBED_PROGRESS,
    { signal: request.signal },
  )) {****
    yield sse({ data: payload });
  }****
})
```

On the client ([`use-embed-activity-sse.ts`](../../src/hooks/use-embed-activity-sse.ts)), each frame updates the status pill, and any row gets upserted into the enriched-repos collection, so newly embedded repos appear in the list while the run continues:

```ts
useEffect(() => {
  return subscribeSseJson<EmbedActivitySsePayload>("/api/elysia/enrich/starred/activity/events", {
    onMessage: (payload) => {
      setStatus(payload.status);
      if (payload.row) upsertEnrichedRepo(payload.row);
    },
  });
}, []);****
```

As a safety net, while a run is live the hook also polls `GET /activity` every 2 s. That way a frame lost during HMR can't leave the spinner stuck.

## Limitations

This isn't RabbitMQ or Redis pub/sub. It's an `EventEmitter` in one Deno process, and for a desktop app with one embedded server and a few windows, that's all it needs to be.

- **Single process only.** Publishers and listeners must live in the same process. That's always true here.
- **No replay.** A client that connects late misses earlier events. The initial fetch, plus the snapshot-first frame on the activity stream, covers that.
- **Not durable.** Events are for live UI only. The real state lives in PGlite and the job queue, so a restart loses progress messages, not data.
- **No backpressure.** Each connection queues events until its generator pulls them, which is fine at the rate a paced worker publishes.

If it ever needed to span processes, only `PubSub` would change: Postgres `LISTEN`/`NOTIFY` or Redis could sit behind the same `publish`/`listen` pair.
