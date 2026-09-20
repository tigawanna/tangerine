/* eslint-disable node/no-process-env */
import { createClient } from "@libsql/client/http";
import { request as httpsRequest } from "node:https";
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
 * Turns `libsql://host` into the HTTP endpoint Turso actually serves.
 */
function toHttpsUrl(url: string) {
  if (url.startsWith("libsql://")) return `https://${url.slice("libsql://".length)}`;
  return url;
}

/**
 * Runs `select 1` via `@libsql/client/http` (shift-sync path).
 */
async function probeLibsql(url: string | undefined, authToken: string | undefined) {
  if (!url) {
    return { ok: false as const, error: "missing url", url: null };
  }

  const client = createClient({ url, authToken });
  try {
    const result = await client.execute("select 1 as x");
    return { ok: true as const, rows: result.rows, url };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "libsql probe failed";
    return { ok: false as const, error: message, url };
  } finally {
    client.close();
  }
}

/**
 * Bypasses the SDK — POSTs Hrana `/v2/pipeline` with undici/`fetch`.
 */
async function probeRawFetch(url: string | undefined, authToken: string | undefined) {
  if (!url) {
    return { ok: false as const, error: "missing url", status: null, body: null };
  }

  const endpoint = `${toHttpsUrl(url).replace(/\/$/, "")}/v2/pipeline`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        requests: [{ type: "execute", stmt: { sql: "select 1 as x" } }, { type: "close" }],
      }),
    });
    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      endpoint,
      body: body.slice(0, 400),
    };
  } catch (error: unknown) {
    return {
      ok: false as const,
      status: null,
      endpoint,
      error: error instanceof Error ? error.message : "raw fetch failed",
      body: null,
    };
  }
}

/**
 * Bypasses `fetch` entirely — `node:https` so we can see if Vercel’s fetch is the problem.
 */
function probeNodeHttps(url: string | undefined, authToken: string | undefined) {
  if (!url) {
    return Promise.resolve({
      ok: false as const,
      error: "missing url",
      status: null,
      body: null,
    });
  }

  const endpoint = new URL(`${toHttpsUrl(url).replace(/\/$/, "")}/v2/pipeline`);
  const payload = JSON.stringify({
    requests: [{ type: "execute", stmt: { sql: "select 1 as x" } }, { type: "close" }],
  });

  return new Promise<{
    ok: boolean;
    status: number | null;
    endpoint: string;
    body: string | null;
    error?: string;
  }>((resolve) => {
    const req = httpsRequest(
      {
        protocol: endpoint.protocol,
        hostname: endpoint.hostname,
        port: endpoint.port || 443,
        path: endpoint.pathname,
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload),
          ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          resolve({
            ok: (res.statusCode ?? 500) < 400,
            status: res.statusCode ?? null,
            endpoint: endpoint.toString(),
            body: body.slice(0, 400),
          });
        });
      },
    );
    req.on("error", (error) => {
      resolve({
        ok: false,
        status: null,
        endpoint: endpoint.toString(),
        body: null,
        error: error.message,
      });
    });
    req.write(payload);
    req.end();
  });
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

  const [libsqlHttp, rawFetch, nodeHttps] = await Promise.all([
    probeLibsql(parsedUrl, parsedToken),
    probeRawFetch(parsedUrl, parsedToken),
    probeNodeHttps(parsedUrl, parsedToken),
  ]);

  return c.json({
    runtime: {
      NODE_ENV: process.env.NODE_ENV ?? null,
      VERCEL: process.env.VERCEL ?? null,
      VERCEL_REGION: process.env.VERCEL_REGION ?? null,
      cwd: process.cwd(),
    },
    processEnv: {
      DATABASE_URL: describeEnvString(processUrl),
      DATABASE_AUTH_TOKEN: describeEnvString(processToken),
    },
    parsedEnv: {
      DATABASE_URL: describeEnvString(parsedUrl),
      DATABASE_AUTH_TOKEN: describeEnvString(parsedToken),
    },
    processEqualsParsed: {
      url: processUrl === parsedUrl,
      token: processToken === parsedToken,
    },
    probes: {
      /** shift-sync path */
      libsql_http: libsqlHttp,
      /** undici / global fetch */
      raw_fetch: rawFetch,
      /** node:https — bypasses fetch */
      node_https: nodeHttps,
    },
  });
});
