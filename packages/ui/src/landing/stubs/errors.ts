/**
 * Narrows an unknown catch value to a displayable Error.
 */
export function unwrapUnknownError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);
  return new Error("Unknown error");
}
