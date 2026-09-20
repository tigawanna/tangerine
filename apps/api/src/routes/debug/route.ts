/* eslint-disable node/no-process-env */
import { createClient } from "@libsql/client";
import { Hono } from "hono";
import { envVariables } from "../../env";

/**
 * Shape of a process env string without relying on the caller to eyeball it.
 */
function describeEnvString(value: string | undefined) {
  if (value === undefined) {
    return { present: false as const, value: null };
  }

  return {
    present: true as const,
    length: value.length,
    empty: value.length === 0,
    quoted: value.startsWith('"') || value.startsWith("'"),
    leadingWhitespace: /^\s/.test(value),
    trailingWhitespace: /\s$/.test(value),
    startsWithEyJ: value.startsWith("eyJ"),
    startsWithLibsql: value.startsWith("libsql://"),
    startsWithHttps: value.startsWith("https://"),
    startsWithFile: value.startsWith("file:"),
    startsWithBearer: /^bearer\s/i.test(value),
    value,
  };
}

/**
 * Runs `select 1` with the given libsql credentials so a 401 shows up here,
 * not only inside Better Auth.
 */
async function probeLibsql(url: string | undefined, authToken: string | undefined) {
  if (!url) {
    return { ok: false as const, error: "missing url" };
  }

  const client = createClient({ url, authToken });
  try {
    const result = await client.execute("select 1 as x");
    return { ok: true as const, rows: result.rows };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "libsql probe failed";
    return { ok: false as const, error: message };
  } finally {
    client.close();
  }
}

function debugSecretFromRequest(request: Request) {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice("bearer ".length).trim();
  }

  return new URL(request.url).searchParams.get("secret");
}

export const debugRoute = new Hono().get("/db-env", async (c) => {
  if (debugSecretFromRequest(c.req.raw) !== envVariables.BETTER_AUTH_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const processUrl = process.env.DATABASE_URL;
  const processToken = process.env.DATABASE_AUTH_TOKEN;
  const parsedUrl = envVariables.DATABASE_URL;
  const parsedToken = envVariables.DATABASE_AUTH_TOKEN;

  const [processProbe, parsedProbe] = await Promise.all([
    probeLibsql(processUrl, processToken),
    probeLibsql(parsedUrl, parsedToken),
  ]);

  return c.json({
    runtime: {
      NODE_ENV: process.env.NODE_ENV ?? null,
      VERCEL: process.env.VERCEL ?? null,
      cwd: process.cwd(),
    },
    processEnv: {
      DATABASE_URL: describeEnvString(processUrl),
      DATABASE_AUTH_TOKEN: describeEnvString(processToken),
      probe: processProbe,
    },
    parsedEnv: {
      DATABASE_URL: describeEnvString(parsedUrl),
      DATABASE_AUTH_TOKEN: describeEnvString(parsedToken),
      probe: parsedProbe,
    },
    processEqualsParsed: {
      url: processUrl === parsedUrl,
      token: processToken === parsedToken,
    },
  });
});
