import { RequestError } from "@repo/github";

/**
 * True when GitHub is asking us to back off (primary or secondary rate limit).
 */
export function isGithubRateLimited(error: unknown): boolean {
  if (error instanceof RequestError) {
    if (error.status === 429) return true;
    if (error.status === 403) {
      const message = error.message.toLowerCase();
      return message.includes("rate limit") || message.includes("secondary rate");
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("rate limit") ||
      message.includes("secondary rate") ||
      message.includes("api rate limit")
    );
  }

  return false;
}
