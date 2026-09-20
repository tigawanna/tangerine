import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { treatyErrorMessage } from "@/elysia/treaty-error.ts";
import { getElysiaTreaty } from "@/elysia/treaty.ts";
import { useMutation } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useState } from "react";

export function PingMessage() {
  const [message, setMessage] = useState("");
  const { mutate, isPending } = useMutation({
    mutationFn: async (input: { message: string }) => {
      const { data, error } = await getElysiaTreaty().hello.post({
        message: input.message,
      });
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
  });

  const trimmed = message.trim();
  const canSend = trimmed.length > 0 && !isPending;

  return (
    <div className="flex w-full items-center justify-center gap-2">
      <Input
        type="text"
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && canSend) mutate({ message: trimmed });
        }}
        data-test="hello-message-input"
      />
      <Button
        disabled={!canSend}
        onClick={() => mutate({ message: trimmed })}
        data-test="hello-ping-button">
        {isPending ? <Loader className="h-4 w-4 animate-spin" /> : "Ping Message"}
      </Button>
    </div>
  );
}
