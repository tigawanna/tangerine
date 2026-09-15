export { db, libsqlClient, type DesktopDatabase } from "./client";
export { ensureVectorIndex } from "./ensure-vector-index";
export {
  defaultDatabaseUrl,
  defaultQueueDatabasePath,
  desktopConfigDir,
  isRemoteDatabaseUrl,
  resolveDatabaseUrl,
  resolvePath,
} from "./path";
export type { ResolvePathInput } from "./path";
export * from "./schema";
