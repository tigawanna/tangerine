/**
 * Server-only GitHub token for public/landing loaders.
 * Authenticated dashboard traffic uses `getClientGithubAccessToken` → apps/api.
 */
export async function getGithubToken(): Promise<string> {
  const pat = process.env.GH_PAT?.trim();
  if (!pat) {
    throw new Error("Set GH_PAT for server-side GitHub loads, or use a signed-in client path.");
  }
  return pat;
}
