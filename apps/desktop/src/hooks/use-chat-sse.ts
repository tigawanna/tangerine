import { chatQueryKey, type ChatRow, type ChatSseEvent } from "@/data-access-layer/chat/chat.ts";
import { subscribeSseJson } from "@/hooks/use-embedding-sse";
import { getElysiaTreaty } from "@/elysia/treaty.ts";
import { getQueryClient } from "@/lib/tanstack/query/queryclient";
import { useEffect } from "react";

/** Apply one SSE chat event to the react-query chat list cache. */
function applyChatSseEvent(event: ChatSseEvent) {
  const queryClient = getQueryClient();
  queryClient.setQueryData<ChatRow[]>(chatQueryKey, (prev) => {
    const list = prev ?? [];
    if (event.type === "created") {
      if (list.some((row) => row.id === event.row.id)) return list;
      return [event.row, ...list];
    }
    return list.filter((row) => row.id !== event.id);
  });
}

/** Stream chat create/delete events into the scratchpad list via SSE. */
export function useChatSse() {
  useEffect(() => {
    const path = getElysiaTreaty().chat.sse["~path"];
    return subscribeSseJson<ChatSseEvent>(path, {
      onMessage: applyChatSseEvent,
    });
  }, []);
}
