import { Hono } from "hono";
import { cors } from "hono/cors";
import { initLogger } from "evlog";
import { createFsDrain } from "evlog/fs";
import { evlog, type EvlogVariables } from "evlog/hono";
import { AUTHORIZED_ORIGINS, envVariables } from "./env";
import { EVLOG_FS_DIR } from "./lib/evlog-dir";
import { auth } from "./lib/auth";
import { viewerRoute } from "./routes/viewer/route";
import { homeRoute } from "./routes/home/route";
import { adminRoute } from "./routes/admin/route";

const isProd = envVariables.NODE_ENV === "production";

initLogger({
  env: {
    service: "tangerine-api",
    environment: envVariables.NODE_ENV,
  },
});

export const app = new Hono<EvlogVariables>()
  .basePath("/api")
  .use(
    "*",
    evlog({
      // Local NDJSON for agent / offline tracing; skip on prod hosts without a writable FS.
      drain: isProd ? undefined : createFsDrain({ dir: EVLOG_FS_DIR, maxFiles: 14 }),
      keep: (ctx) => {
        // Always retain auth + electron handoff traffic while debugging OAuth.
        if (ctx.path?.includes("/auth")) ctx.shouldKeep = true;
      },
    }),
  )
  .use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return origin;
        if (AUTHORIZED_ORIGINS.includes(origin)) return origin;
        if (envVariables.FRONTEND_URL) return envVariables.FRONTEND_URL;
        return AUTHORIZED_ORIGINS[0] ?? origin;
      },
      credentials: true,
    }),
  )
  .route("/", homeRoute)
  .on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw))
  .route("/viewer", viewerRoute)
  .route("/admin", adminRoute);

export type AppType = typeof app;
