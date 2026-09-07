import { serve } from "@hono/node-server";
import { app } from "./app";
import { envVariables } from "./env";

const port = envVariables.PORT;

console.log(`API running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export type { AppType } from "./app";
export { app };
export default app;
