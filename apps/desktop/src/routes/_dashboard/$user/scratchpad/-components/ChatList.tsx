import { Button } from "@/components/ui/button.tsx";
import { deleteChat, chatQueryKey, type ChatRow } from "@/data-access-layer/chat/chat.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader, Trash2 } from "lucide-react";

type ChatListProps = {
  chats: ChatRow[];
};

export function ChatList({ chats }: ChatListProps) {
  const queryClient = useQueryClient();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: (id: number) => deleteChat(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKey });
    },
  });

  if (chats.length === 0) {
    return (
      <p className="text-muted-foreground text-sm" data-test="chat-list-empty">
        No chats yet. Add one below.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2" data-test="chat-list">
      {chats.map((row) => {
        const deleting = isPending && variables === row.id;
        return (
          <li
            key={row.id}
            className="hover:bg-muted/50 flex items-start justify-between gap-3 rounded-md px-3 py-2 transition-colors"
            data-test="chat-list-item">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium wrap-break-word">{row.message}</p>
              <p className="text-muted-foreground text-xs">
                {new Date(row.createdAt).toLocaleString()}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={deleting}
              onClick={() => mutate(row.id)}
              aria-label={`Delete chat ${row.id}`}
              data-test="chat-delete-button">
              {deleting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
