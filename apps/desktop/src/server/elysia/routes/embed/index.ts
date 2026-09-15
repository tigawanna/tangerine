import { Elysia } from "elysia";
import { embedReposRoute } from "@/server/elysia/routes/embed/repos.ts";

export const embedRoute = new Elysia({ prefix: "/embed" })
  .use(embedReposRoute);
