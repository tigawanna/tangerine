import type { PinnedViewerReposResponse, RequestError } from "@/types/github";
import { createServerFn } from "@tanstack/react-start";
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

export const getRecentRepos = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const result = await fetchRecentReposFromGithub();
    setPublicGithubCacheHeaders();
    return {
      data: result.data,
      errors: result.errors,
    };
  } catch {
    return { data: null, errors: [] as RequestError[] };
  }
});
