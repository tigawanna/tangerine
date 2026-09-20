import { handle } from "@hono/node-server/vercel";
import { app } from "./app";

/** Vercel Node entry — wraps the Hono app for the Node.js launcher. */
export default handle(app);
