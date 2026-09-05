import { createGitHubClient } from "@repo/github";
import { getGithubToken } from "@/lib/github-token.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const repoDetailInput = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

/**
 * Fetches a single repository and its README for the in-app details page.
 */
export const getRepoDetail = createServerFn({ method: "GET" })
  .inputValidator(repoDetailInput)
  .handler(async ({ data }) => {
    try {
      const client = createGitHubClient(await getGithubToken());
      const [repository, readme] = await Promise.all([
        client.getRepoDetail(data.owner, data.repo),
        client.getRepoReadme(data.owner, data.repo),
      ]);
      return {
        data: repository,
        readme: readme?.content ?? null,
        readmePath: readme?.path ?? null,
        error: null as string | null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load repository";
      return {
        data: null,
        readme: null,
        readmePath: null,
        error: message,
      };
    }
  });
