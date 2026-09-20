import { envVariables } from "../env";
import { createRemoteDb } from "./http-client";
import { createLocalDb } from "./local-client";
import { isTursoRemote } from "./turso";

/** Both factories return the same `drizzle-orm/libsql` shape. */
export type AppDatabase = ReturnType<typeof createRemoteDb>;

/**
 * Opens Drizzle against Turso HTTP or local `file:` — same split as shift-sync.
 */
function openDb(): AppDatabase {
  const url = envVariables.DATABASE_URL.trim();
  const authToken = envVariables.DATABASE_AUTH_TOKEN?.trim();

  if (isTursoRemote(url)) {
    if (!authToken) {
      throw new Error("DATABASE_AUTH_TOKEN is required for Turso");
    }
    return createRemoteDb(url, authToken);
  }

  return createLocalDb(url, authToken);
}

export const db = openDb();
