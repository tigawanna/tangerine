import type { Environment } from "relay-runtime";

/** Router context slice for Relay — only populated under `/_dashboard`. */
export type RelayRouterContext = {
  relayEnvironment: Environment | null;
};
