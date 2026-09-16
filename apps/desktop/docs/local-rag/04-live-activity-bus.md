# Chapter 4: Live activity bus (Elysia SSE + EventEmitter)

[Series index](./README.md) · Prev: [Chapter 3](./03-worker-engine.md) · Next: [Chapter 5: Query path](./05-query-path.md)

The demo routes under `/api/elysia/hello/*` are the toy version of this pattern.

## Why this chapter exists in a RAG app

Embedding a star list is slow on purpose. You pull resources from GitHub, stay under rate limits, chunk text, run local embeddings, and write into the vector DB. That can take minutes. The UI needs a live feed: “fetched repo X,” “embedded chunk 40/200,” “upserted into the vector index,” without polling.

Same pub/sub shape as any progress ticker. In our case the “messages” are RAG pipeline breadcrumbs.

## The idea

One HTTP client *listens*; another request (or the worker) *publishes*. Server-Sent Events handle the listen side. A module-scoped `EventEmitter` is the bus in the middle.

```ts
const helloEmitter = new EventEmitter<{ message: [message: string] }>();
```

POST emits. GET `/sse` waits on those emits and yields SSE frames. Swap the string for a typed progress event (`repo`, `phase`, `pct`) when you wire the real embedding worker.

## Listen: async generator + `on()`

Node’s `on(emitter, event, { signal })` turns the emitter into an async iterable. Each emit is one loop iteration. Pass `request.signal` so when the client disconnects, the loop ends and listeners are cleaned up.

```ts
.get("/sse", async function* ({ request }) {
  for await (const [message] of on(helloEmitter, "message", {
    signal: request.signal,
  })) {
    yield sse({ data: message });
  }
})
```

Elysia’s `sse()` helper shapes each chunk. No manual `text/event-stream` headers or keep-alive plumbing for the happy path.

Watch the coupling though: `emit` is synchronous and does not wait for consumers. `on()` buffers each event until the `for await` loop pulls it. If `yield sse(...)` is slow (slow client, full TCP window, paused stream), that buffer grows per connection. The async iterator becomes a choke point and a memory risk, not a backpressure valve back to the publisher.

## Publish: plain POST (or worker emit)

```ts
.post("/", ({ body }) => {
  helloEmitter.emit("message", body.message);
  return { message: `Emitted ${body.message}` };
})
```

Any process that can import the same emitter can publish: another route, the chapter-3 worker mid-embedding, a webhook handler. The SSE clients do not care who emitted. In the RAG pipeline the worker is the real publisher; POST is just the hello demo.

## Why this shape works for demos (and small apps)

- **Decoupled producers and consumers.** Writers never know about open sockets.
- **Disconnect is free.** AbortSignal stops the `for await` and drops listeners.
- **Typed events.** `EventEmitter<HelloEmitterEvents>` keeps payloads honest.
- **One process only.** This bus is in-memory. Multiple server instances need Redis, NATS, or similar if every replica must see every emit.

## Why we overlook most of the downsides here

This bus lives inside a **Deno Desktop** app with a **TanStack Start** UI: one local process, one (or a few) clients on localhost, not a fleet of servers.

Its job is narrow: **stream live activity from long-running local RAG work** (GitHub pulls throttled to rate limits, Gemma embedding batches, vector DB writes) into the UI while they run. We care about “what is happening right now,” not a durable event log or cross-machine fan-out. Searchability of starred repos via natural language is the product; this chapter only keeps the progress pane honest.

That context makes the usual objections mostly theoretical:

- No multi-instance fan-out: there is a single embedded server.
- Restarts drop in-flight progress UI; the job either resumes from its own checkpoint (chapter 3) or the user starts again.
- Backpressure and `on()` buffering matter less when the publisher is a paced local worker and the consumer is the same machine’s UI at human-readable event rates.
- Cross-service brokers add ops weight we do not need for localhost progress ticks.

The list below still matters for a hosted multi-user API. For this desktop live-activity path, the in-memory emitter is the right tradeoff: small, typed, and good enough.

## When you need something more robust

An in-process emitter is fine for demos, single-instance apps, and the desktop RAG case above. For a serious multi-user backend you usually outgrow it fast:

- **Multiple instances.** Load-balanced servers each have their own memory. A POST on instance A never reaches SSE clients on instance B.
- **Restarts and deploys.** In-memory state dies with the process. Missed emits, no replay, no backlog for clients that reconnect.
- **Durability and fan-out.** You may want at-least-once delivery, acknowledgements, retention, or many consumer groups reading the same stream.
- **Cross-service traffic.** Workers, webhooks, and other apps should publish without sharing a Node module.
- **Backpressure.** A fast publisher and a slow SSE client do not meet in the middle. Emits keep landing; `on()` queues them. Under burst traffic you either drop, coalesce, or spill to a broker that can bound buffers and apply consumer lag policies.
- **`on()` as a per-connection queue.** Every open `/sse` subscription gets its own async-iterator buffer. Many slow clients means many growing queues in one process. That is a quiet choke point before CPU or the EventEmitter itself looks busy.

Keep SSE (or WebSockets) as the browser edge. Put a real pub/sub (or stream) behind the emitter so every replica can subscribe and forward.

### Pub/sub options

| Option | Good fit when |
| --- | --- |
| **Redis Pub/Sub** | Simple fan-out across instances; fire-and-forget is enough |
| **Redis Streams** | You want persistence, consumer groups, and replay |
| **NATS** / **NATS JetStream** | Lightweight messaging; JetStream adds durability |
| **RabbitMQ** | Queues, routing keys, and classic AMQP patterns |
| **Apache Kafka** / **Redpanda** | High-throughput event logs, many consumers, long retention |
| **Postgres `LISTEN` / `NOTIFY`** | Small scale and you already run Postgres; not for heavy load |
| **Managed** (Ably, Pusher, Supabase Realtime, etc.) | You want channels and presence without operating the bus |

The pub/sub pattern stays the same: publish into the bus, each server process subscribes and yields `sse({ data })` to its connected clients. For us, those publishes are “still embedding under GitHub rate limits” heartbeats, not a second vector store.
