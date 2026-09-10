import { setResponseHeader } from "@tanstack/react-start/server";

/**
 * Sets CDN-safe cache headers for public GitHub repo payloads.
 * Browser always revalidates; Vercel Edge may serve a cached copy for 1h.
 * Only call after confirming the response contains no private/auth-scoped data.
 */
export function setPublicGithubCacheHeaders() {
  setResponseHeader("Cache-Control", "public, max-age=0, must-revalidate");
  setResponseHeader("Vercel-CDN-Cache-Control", "public, max-age=3600, stale-while-revalidate=600");
}
