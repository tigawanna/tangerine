import type { Environment } from "relay-runtime";

/** Router context slice for Relay — only populated under `/_dashboard`. */
export type RelayRouterContext = {
  relayEnvironment: Environment | null;
  /** Signed-in GitHub login from Better Auth (`user.githubUsername`). */
  githubLogin: string | null;
};
