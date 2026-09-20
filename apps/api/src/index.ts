/* eslint-disable node/no-process-env */
import { serve } from "@hono/node-server";
import { app } from "./app";
import { envVariables } from "./env";

export type { AppType } from "./app";
export { app };
export default app;

/** Local Node server only — Vercel uses the default Hono export as a Function. */
if (!process.env.VERCEL) {
  const port = envVariables.PORT;
  console.log(`API running on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}
