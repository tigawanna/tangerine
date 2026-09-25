import { chatQueryKey, listChats } from "@/data-access-layer/chat/chat.ts";
import { useChatSse } from "@/hooks/use-chat-sse.ts";
import { ChatInput } from "@/routes/_dashboard/$user/scratchpad/-components/ChatInput.tsx";
import { ChatList } from "@/routes/_dashboard/$user/scratchpad/-components/ChatList.tsx";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader, RefreshCcw } from "lucide-react";

export function Scratchpad() {
  useChatSse();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: chatQueryKey,
    queryFn: listChats,
  });

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6"
      data-test="scratchpad-page">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Scratchpad</h1>
          <p className="text-muted-foreground text-sm">Local chat messages stored in PGlite.</p>
          <Link to="/$user/scratchpad/two" params={{ user: "tigawanna" }}>Two</Link>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isRefetching}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
          data-test="chat-refresh-button">
          <RefreshCcw
            data-loading={isRefetching}
            className="h-4 w-4 data-[loading=true]:animate-spin"
          />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12">
          <Loader className="h-4 w-4 animate-spin" />
        </div>
      ) : null}

      {error ? (
        <p className="text-destructive text-sm" data-test="chat-list-error">
          {error.message}
        </p>
      ) : null}

      {!isLoading && !error ? <ChatList chats={data ?? []} /> : null}

      <ChatInput />
    </div>
  );
}
