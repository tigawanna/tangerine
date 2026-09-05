import type { RecordSourceSelectorProxy } from "relay-runtime";

/**
 * True when a Relay/GitHub GraphQL error is a missing `user:follow` scope.
 */
export function isMissingFollowScope(
  errors: ReadonlyArray<{ message: string; type?: string }> | null | undefined,
): boolean {
  if (!errors?.length) return false;
  return errors.some((error) => {
    const message = error.message;
    return (
      message.includes("user:follow") ||
      message.includes("INSUFFICIENT_SCOPES") ||
      error.type === "INSUFFICIENT_SCOPES"
    );
  });
}

/**
 * Marks `viewerIsFollowing` on a User record in the Relay store.
 */
export function setViewerIsFollowing(
  store: RecordSourceSelectorProxy,
  userId: string,
  value: boolean,
): void {
  store.get(userId)?.setValue(value, "viewerIsFollowing");
}
