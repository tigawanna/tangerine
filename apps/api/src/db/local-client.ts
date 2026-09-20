import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema/index";

/**
 * Local `file:` SQLite via the Node libSQL driver (native bindings OK off-Vercel).
 */
export function createLocalDb(url: string, authToken?: string) {
  const client = createClient({
    url,
    authToken,
  });

  return drizzle(client, { schema });
}
