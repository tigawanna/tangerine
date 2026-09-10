/// <reference lib="deno.ns" />

import { logDesktopAuth } from "../evlog.ts";
import { authenticate } from "./authenticate.ts";
import { loopbackPort } from "./config.ts";
import { LOOPBACK } from "./constants.ts";
import { getAuthListeners } from "./listeners.ts";
import type { LoopbackHandle } from "./types.ts";

function loopbackHandle(): LoopbackHandle | undefined {
  const g = globalThis as typeof globalThis & { [LOOPBACK]?: LoopbackHandle };
  return g[LOOPBACK];
}

function setLoopbackHandle(next: LoopbackHandle | undefined): void {
  const g = globalThis as typeof globalThis & { [LOOPBACK]?: LoopbackHandle };
  if (next) g[LOOPBACK] = next;
  else delete g[LOOPBACK];
}

let startingLoopback: Promise<string> | null = null;

/**
 * Ensure the OAuth loopback is listening. Safe to call at startup and from
 * `requestAuth`. Probes `/health` so HMR cannot reuse a dead Symbol handle.
 */
export async function startLoopbackServer(): Promise<string> {
  if (startingLoopback) return startingLoopback;
  startingLoopback = ensureLoopbackServer().finally(() => {
    startingLoopback = null;
  });
  return startingLoopback;
}

async function probeLoopback(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(750),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureLoopbackServer(): Promise<string> {
  const preferredPort = loopbackPort();
  const existing = loopbackHandle();
  if (existing && (await probeLoopback(existing.port))) {
    const callbackUrl = `http://127.0.0.1:${existing.port}/callback`;
    logDesktopAuth("desktop.auth.loopback_listen", {
      reused: true,
      port: existing.port,
      preferredPort,
      loopback: callbackUrl,
    });
    return callbackUrl;
  }

  existing?.abort.abort();
  try {
    await existing?.server.shutdown();
  } catch {
    // already closed
  }
  setLoopbackHandle(undefined);

  const abort = new AbortController();
  const corsHeaders = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type, accept, x-tangerine-handoff",
  } as const;

  let resolveListen: ((addr: { hostname: string; port: number }) => void) | undefined;
  let rejectListen: ((error: unknown) => void) | undefined;
  const listened = new Promise<{ hostname: string; port: number }>((resolve, reject) => {
    resolveListen = resolve;
    rejectListen = reject;
  });

  // Deno Desktop may remap the requested port — always trust onListen.
  let boundPort = preferredPort;

  try {
    const server = Deno.serve(
      {
        hostname: "127.0.0.1",
        port: preferredPort,
        signal: abort.signal,
        onListen: (addr) => {
          boundPort = addr.port;
          resolveListen?.(addr);
          logDesktopAuth("desktop.auth.loopback_listen", {
            reused: false,
            port: addr.port,
            preferredPort,
            remapped: addr.port !== preferredPort,
            hostname: addr.hostname,
            loopback: `http://127.0.0.1:${addr.port}/callback`,
          });
        },
      },
      async (req: Request) => {
        if (req.method === "OPTIONS") {
          return new Response(null, { status: 204, headers: corsHeaders });
        }

        const url = new URL(req.url);
        if (url.pathname === "/health") {
          return Response.json({ ok: true }, { headers: corsHeaders });
        }
        if (url.pathname !== "/callback") {
          return new Response("Not found", {
            status: 404,
            headers: corsHeaders,
          });
        }

        const token = url.searchParams.get("token");
        const wantsJson =
          req.headers.get("accept")?.includes("application/json") ||
          req.headers.get("x-tangerine-handoff") === "1";

        if (!token) {
          logDesktopAuth(
            "desktop.auth.loopback",
            { ok: false, reason: "missing_token", path: url.pathname, port: boundPort },
            "warn",
          );
          if (wantsJson) {
            return Response.json(
              { ok: false, error: "missing_token" },
              { status: 400, headers: corsHeaders },
            );
          }
          return new Response(
            "<!doctype html><p>Missing token. Close this tab and paste the code in the app.</p>",
            {
              status: 400,
              headers: { ...corsHeaders, "content-type": "text/html; charset=utf-8" },
            },
          );
        }

        try {
          logDesktopAuth("desktop.auth.loopback", {
            ok: true,
            tokenLength: token.length,
            path: url.pathname,
            port: boundPort,
            via: wantsJson ? "fetch" : "navigation",
          });
          await authenticate({ token });
          if (wantsJson) {
            return Response.json({ ok: true }, { headers: corsHeaders });
          }
          return new Response(
            `<!doctype html><title>Signed in</title>
             <p>Signed in. You can close this tab and return to Tangerine.</p>
             <script>window.close()</script>`,
            {
              headers: { ...corsHeaders, "content-type": "text/html; charset=utf-8" },
            },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Authentication failed";
          logDesktopAuth(
            "desktop.auth.loopback",
            { ok: false, message, port: boundPort },
            "error",
          );
          getAuthListeners().onAuthError?.(message);
          if (wantsJson) {
            return Response.json(
              { ok: false, error: message },
              { status: 400, headers: corsHeaders },
            );
          }
          return new Response(`<!doctype html><p>${message}</p>`, {
            status: 400,
            headers: { ...corsHeaders, "content-type": "text/html; charset=utf-8" },
          });
        }
      },
    );

    await Promise.race([
      listened,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("loopback onListen timed out")), 3000);
      }),
    ]);

    const callbackUrl = `http://127.0.0.1:${boundPort}/callback`;
    setLoopbackHandle({ abort, port: boundPort, server });

    if (!(await probeLoopback(boundPort))) {
      abort.abort();
      setLoopbackHandle(undefined);
      throw new Error(`loopback health check failed after bind on ${boundPort}`);
    }

    return callbackUrl;
  } catch (error) {
    rejectListen?.(error);
    setLoopbackHandle(undefined);
    const message = error instanceof Error ? error.message : String(error);
    logDesktopAuth(
      "desktop.auth.loopback_listen",
      { ok: false, port: preferredPort, message },
      "error",
    );
    throw new Error(`Desktop auth loopback failed (preferred ${preferredPort}). (${message})`);
  }
}
