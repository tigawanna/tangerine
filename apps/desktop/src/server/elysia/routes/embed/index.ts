import { Elysia } from "elysia";
import { embedReposRoute } from "@/server/elysia/routes/embed/repos.ts";

/** Repo list + enqueue under `/api/elysia/embed/*` (not the text playground). */
export const repoEmbedRoute = new Elysia({ prefix: "/embed" }).use(embedReposRoute);
