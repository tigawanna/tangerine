import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { createChat } from "@/data-access-layer/chat/chat.ts";
import { useMutation } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useState } from "react";

export function ChatInput() {
  const [message, setMessage] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: (input: string) => createChat(input),
    onSuccess: () => {
      setMessage("");
    },
  });

  const trimmed = message.trim();
  const canSend = trimmed.length > 0 && !isPending;

  return (
    <form
      className="flex w-full items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSend) return;
        mutate(trimmed);
      }}
      data-test="chat-input-form">
      <Input
        type="text"
        placeholder="Write a chat message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        data-test="chat-message-input"
      />
      <Button type="submit" disabled={!canSend} data-test="chat-send-button">
        {isPending ? <Loader className="h-4 w-4 animate-spin" /> : "Send"}
      </Button>
    </form>
  );
}
