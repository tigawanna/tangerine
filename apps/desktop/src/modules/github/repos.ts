import type { PinnedViewerReposResponse, RequestError } from "@/types/github";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchPinnedReposFromGithub, fetchRecentReposFromGithub } from "./fetch-repos";
import { setPublicGithubCacheHeaders } from "./public-cache-headers";

export const getPinnedRepos = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const nodes = await fetchPinnedReposFromGithub();
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
      const result = await fetchRecentReposFromGithub({
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
