import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { envVariables } from "../env";
import * as schema from "./schema/index";

const url = envVariables.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required");
}

const client = createClient({
  url,
  authToken: envVariables.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export type AppDatabase = typeof db;
