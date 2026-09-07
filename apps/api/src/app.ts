import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { AUTHORIZED_ORIGINS, envVariables } from "./env";
import { auth } from "./lib/auth";
import { viewerRoute } from "./routes/viewer/route";
import { homeRoute } from "./routes/home/route";
import { adminRoute } from "./routes/admin/route";

export const app = new Hono()
  .basePath("/api")
  .use("*", logger())
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
