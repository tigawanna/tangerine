import { Elysia, sse, t } from "elysia";
import { EventEmitter } from "node:events";

const helloEmitter = new EventEmitter();

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
      const pending: string[] = [];
      let wake: (() => void) | undefined;

      const onMessage = (message: string) => {
        pending.push(message);
        wake?.();
        wake = undefined;
      };

      helloEmitter.on("message", onMessage);

      try {
        while (!request.signal.aborted) {
          if (pending.length === 0) {
            await new Promise<void>((resolve) => {
              if (request.signal.aborted) {
                resolve();
                return;
              }
              wake = resolve;
              request.signal.addEventListener("abort", () => resolve(), { once: true });
            });
          }

          while (pending.length > 0 && !request.signal.aborted) {
            yield sse({ data: pending.shift()! });
          }
        }
      } finally {
        helloEmitter.off("message", onMessage);
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
  .post("/", ({ body }) => {
    helloEmitter.emit("message", body.message);
    return {
      message: `Emitted ${body.message}`,
    };
  }, {
    body: t.Object({
      message: t.String(),
    }),
    detail: {
      summary: "Hello, world!",
      description: "Hello, world!",
      tags: ["hello"],
    },
  });
