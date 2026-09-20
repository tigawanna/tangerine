import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../../db/client";
import { envVariables } from "../../env";

function debugSecretFromRequest(request: Request) {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice("bearer ".length).trim();
  }

  return new URL(request.url).searchParams.get("secret");
}

async function pingDb(c: { json: (body: unknown, status?: number) => Response; req: { raw: Request } }) {
  if (debugSecretFromRequest(c.req.raw) !== envVariables.BETTER_AUTH_SECRET) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  try {
    const rows = await db.all(sql`select 1 as x`);
    return c.json({ ok: true, rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "db ping failed";
    return c.json({ ok: false, error: message }, 500);
  }
}

/**
 * Pings Turso through the same Drizzle client the app uses.
 * `/db-env` kept as an alias so old curls still work after deploy.
 */
export const debugRoute = new Hono().get("/db", pingDb).get("/db-env", pingDb);
