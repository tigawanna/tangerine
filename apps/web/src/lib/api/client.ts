import type { AppType } from "@api/app";
import { hc } from "hono/client";
import { clientEnv } from "@/lib/envs/client-env";

/**
 * Typed Hono RPC client for `apps/api` via same-origin `/api` proxy.
 * Prefer `import type` so the API server entry is never bundled into the browser.
 */
export const honoClient = hc<AppType>(clientEnv.VITE_APP_URL, {
  init: {
    credentials: "include",
  },
});

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  status: "success" | "error";
}

export interface ApiError {
  message: string;
  code?: string;
}
