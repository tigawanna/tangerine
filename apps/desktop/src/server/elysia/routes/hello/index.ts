import { pubSub } from "@/lib/pub-sub/client";
import { PUB_SUB_TOPICS } from "@/lib/pub-sub/topics";
import { Elysia, sse, t } from "elysia";

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
      // `listen()` turns pub/sub into an async iterable — each POST publish yields one loop iteration.
      // `{ signal }` ends the loop (and removes listeners) when the client disconnects.
      for await (const message of pubSub.listen<string>(PUB_SUB_TOPICS.HELLO_MESSAGE, {
        signal: request.signal,
      })) {
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
      pubSub.publish(PUB_SUB_TOPICS.HELLO_MESSAGE, body.message);
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
