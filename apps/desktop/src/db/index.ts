export { client, db, pgClient, pglite, type DesktopDatabase } from "./client";
export {
  liveChanges,
  liveIncrementalQuery,
  liveQuery,
  type DrizzleStatement,
  type LiveRowOf,
  type LiveWindow,
} from "./live";
export { desktopConfigDir, resolveDatabaseDir, resolveLocalPath } from "./path";
export * from "./schema";
