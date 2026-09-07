import { auth } from "@api/lib/auth";
import { Hono } from "hono";

export const viewerRoute = new Hono().get("/", async (c) => {
  const session = await auth.api.getSession({
    headers: new Headers(c.req.raw.headers),
  });

  if (!session) {
    return c.json({ error: "Unauthorized", user: null, session: null }, 401);
  }

  return c.json({
    user: session.user,
    session: session.session,
  });
});
