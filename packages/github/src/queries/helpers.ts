import { RequestError } from "octokit";

/**
 * Returns true when an Octokit error is an HTTP 404.
 */
export function isNotFoundError(error: unknown) {
  return error instanceof RequestError && error.status === 404;
}

/**
 * Decodes a base64 GitHub file content payload to UTF-8 text.
 */
export function decodeBase64Content(content: string) {
  return new TextDecoder().decode(
    Uint8Array.from(atob(content.replace(/\n/g, "")), (character) => character.charCodeAt(0)),
  );
}
