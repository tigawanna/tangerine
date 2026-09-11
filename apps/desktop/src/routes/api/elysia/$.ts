import { elysiaApp } from "@/server/elysia/app";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Mount Elysia under `/api/elysia/*` inside TanStack Start.
 * @see https://elysiajs.com/integrations/tanstack-start
 */
const handle = ({ request }: { request: Request }) => elysiaApp.fetch(request);

export const Route = createFileRoute("/api/elysia/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
