import { createClient } from "@libsql/client/http";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema/index";

/**
 * Remote Turso over HTTP — matches shift-sync (`@libsql/client/http`).
 * No native bindings; safe for the Vercel Node bundle.
 */
export function createRemoteDb(url: string, authToken: string) {
  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}
