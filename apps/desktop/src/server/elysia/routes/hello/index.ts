import { Elysia, sse, t } from "elysia";
import { EventEmitter, on } from "node:events";

interface HelloEmitterEvents {
  message: [message: string];
}

const helloEmitter = new EventEmitter<HelloEmitterEvents>();

/** Demo hello routes under `/api/elysia/hello/*`. */
export const helloRoute = new Elysia({ prefix: "/hello" })
  .get("/", () => [{ id: "1", message: "Hello, world!" }], {
    detail: {
      summary: "Hello, world!",
      description: "Hello, world!",
      tags: ["hello"],
    },
  })
  .get(
    "/sse",
    async function* ({ request }) {
      // `on()` turns EventEmitter into an async iterable — each POST emit yields one loop iteration.
      // `{ signal }` ends the loop (and removes listeners) when the client disconnects.
      for await (const [message] of on(helloEmitter, "message", { signal: request.signal })) {
        yield sse({ data: message });
      }
    },
    {
      detail: {
        summary: "Hello SSE",
        description: "Streams messages emitted via POST /hello.",
        tags: ["hello"],
      },
    },
  )
  .post(
    "/",
    ({ body }) => {
      helloEmitter.emit("message", body.message);
      return {
        message: `Emitted ${body.message}`,
      };
    },
    {
      body: t.Object({
        message: t.String(),
      }),
      detail: {
        summary: "Hello, world!",
        description: "Hello, world!",
        tags: ["hello"],
      },
    },
  );
