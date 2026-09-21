import type { ElysiaTreaty } from "@/elysia/treaty";
import { getElysiaTreaty } from "@/elysia/treaty";
import { treatyErrorMessage } from "@/elysia/treaty-error";

type AwaitedData<T> = NonNullable<Awaited<T> extends { data: infer D } ? D : never>;

/** One row from `GET /api/elysia/chat`. */
export type ChatRow = AwaitedData<ReturnType<ElysiaTreaty["chat"]["get"]>>[number];

/** Payload streamed on `/chat/sse` after create/delete. */
export type ChatSseEvent =
  | { type: "created"; row: ChatRow }
  | { type: "deleted"; id: number };

export const chatQueryKey = ["chat"] as const;

/** Fetch all chat messages (newest first). */
export async function listChats(): Promise<ChatRow[]> {
  const { data, error } = await getElysiaTreaty().chat.get();
  if (error) throw new Error(treatyErrorMessage(error));
  return data ?? [];
}

/** Insert one chat message. */
export async function createChat(message: string): Promise<ChatRow> {
  const { data, error } = await getElysiaTreaty().chat.post({ message });
  if (error) throw new Error(treatyErrorMessage(error));
  if (!data) throw new Error("Chat create returned no data");
  return data;
}

/** Delete one chat message by id. */
export async function deleteChat(id: number): Promise<void> {
  const { data, error } = await getElysiaTreaty().chat({ id }).delete();
  if (error) throw new Error(treatyErrorMessage(error));
  if (data && "error" in data && data.error) {
    throw new Error(data.error.message);
  }
}
