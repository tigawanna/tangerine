/**
 * Resolves the signed-in user's GitHub login from the OAuth access token.
 * Prefer this over session-only fields — cookie sessions may omit `githubUsername`.
 */
export async function fetchGithubLogin(accessToken: string): Promise<string> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve GitHub login (${response.status})`);
  }

  const body: unknown = await response.json();
  if (
    !body ||
    typeof body !== "object" ||
    !("login" in body) ||
    typeof body.login !== "string" ||
    !body.login.trim()
  ) {
    throw new Error("GitHub /user response missing login");
  }

  return body.login.trim();
}
