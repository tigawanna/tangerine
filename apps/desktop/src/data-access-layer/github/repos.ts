import { getGithubToken } from "@/lib/github-token.server";
import type { PinnedViewerReposResponse, RequestError } from "@/types/github";
import { createGitHubClient } from "@repo/github";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";

/**
 * CDN-safe cache headers for public GitHub repo payloads.
 * Browser always revalidates; Vercel Edge may serve a cached copy for 1h.
 */
function setPublicGithubCacheHeaders() {
  setResponseHeader("Cache-Control", "public, max-age=0, must-revalidate");
  setResponseHeader("Vercel-CDN-Cache-Control", "public, max-age=3600, stale-while-revalidate=600");
}

export const getPinnedRepos = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const nodes = await createGitHubClient(await getGithubToken()).getPinnedRepos();
    setPublicGithubCacheHeaders();
    return {
      data: {
        viewer: {
          pinnedItems: { nodes },
          repositories: { nodes: [] },
        },
      },
    } satisfies PinnedViewerReposResponse;
  } catch {
    return null;
  }
});

const recentReposInput = z.object({
  isFork: z.boolean().nullable().optional(),
});

export const getRecentRepos = createServerFn({ method: "GET" })
  .inputValidator(recentReposInput)
  .handler(async ({ data }) => {
    try {
      const result = await createGitHubClient(await getGithubToken()).getRecentRepos({
        // `null` / omitted → all repos; `true`/`false` filters forks.
        isFork: data.isFork ?? undefined,
      });
      setPublicGithubCacheHeaders();
      return {
        data: result.data,
        errors: result.errors,
      };
    } catch {
      return { data: null, errors: [] as RequestError[] };
    }
  });
