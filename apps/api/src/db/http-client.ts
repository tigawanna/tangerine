import { createClient } from "@libsql/client/http";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema/index";
import { vercelSafeLibsqlFetch } from "./vercel-safe-fetch";

/**
 * Remote Turso over HTTP — matches shift-sync (`@libsql/client/http`), with a
 * Vercel-safe fetch wrapper so the JWT actually reaches Turso.
 */
export function createRemoteDb(url: string, authToken: string) {
  const client = createClient({
    url,
    authToken,
    fetch: vercelSafeLibsqlFetch(authToken),
  });
  return drizzle(client, { schema });
}
