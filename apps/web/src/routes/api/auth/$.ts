import { getAuth } from "@/lib/auth.server";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return getAuth().handler(request);
      },
      POST: async ({ request }) => {
        return getAuth().handler(request);
      },
    },
  },
});
