import type { ChatSseEvent } from "@/data-access-layer/chat/chat.ts";
import { pubSub } from "@/lib/pub-sub/client";
import { PUB_SUB_TOPICS } from "@/lib/pub-sub/topics";
import { db } from "@/pglite/client.ts";
import { chat } from "@/pglite/index.ts";
import { eq } from "drizzle-orm";
import { Elysia, sse, t } from "elysia";

/** Chat messages under `/api/elysia/chat/*`. */
export const chatRoute = new Elysia({ prefix: "/chat" })
  .get(
    "/",
    async () => {
      return db.query.chat.findMany({
        orderBy: (row, { desc }) => [desc(row.createdAt)],
      });
    },
    {
      detail: {
        summary: "List chat messages",
        description: "Get all chat messages, newest first.",
        tags: ["chat"],
      },
    },
  )
  .get(
    "/sse",
    async function* ({ request }) {
      for await (const event of pubSub.listen<ChatSseEvent>(PUB_SUB_TOPICS.CHAT_MESSAGE, {
        signal: request.signal,
      })) {
        yield sse({ data: event });
      }
    },
    {
      detail: {
        summary: "Chat SSE",
        description: "Streams chat create/delete events from POST/DELETE /chat.",
        tags: ["chat"],
      },
    },
  )
  .post(
    "/",
    async ({ body }) => {
      const [row] = await db.insert(chat).values({ message: body.message }).returning();
      if (row) {
        pubSub.publish(PUB_SUB_TOPICS.CHAT_MESSAGE, {
          type: "created",
          row,
        } satisfies ChatSseEvent);
      }
      return row;
    },
    {
      body: t.Object({
        message: t.String({ minLength: 1 }),
      }),
      detail: {
        summary: "Create a chat message",
        description: "Insert one chat message and return the row.",
        tags: ["chat"],
      },
    },
  )
  .delete(
    "/:id",
    async ({ params }) => {
      try {
        const id = Number(params.id);
        if (!Number.isFinite(id)) {
          return {
            data: null,
            error: {
              message: "Valid id is required",
              code: "MISSING_ID",
            },
          };
        }

        await db.delete(chat).where(eq(chat.id, id));
        pubSub.publish(PUB_SUB_TOPICS.CHAT_MESSAGE, {
          type: "deleted",
          id,
        } satisfies ChatSseEvent);
        return {
          data: {
            message: "Chat deleted",
          },
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: {
            message: "Failed to delete chat",
            code: "FAILED_TO_DELETE_CHAT",
          },
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        id: t.Numeric(),
      }),
      detail: {
        summary: "Delete a chat message",
        description: "Delete one chat message by id.",
        tags: ["chat"],
      },
    },
  );
