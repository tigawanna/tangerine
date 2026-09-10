import { getAuth } from "@/lib/auth.server";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

/** Current Better Auth session, or null on public/prerender requests. */
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const headers = getRequestHeaders();
    return await getAuth().api.getSession({ headers });
  } catch {
    return null;
  }
});
