import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/sqlite-core";

/**
 * Turso/libSQL native float32 vector column (`F32_BLOB(n)`).
 * Requires `@libsql/client` — not plain SQLite / better-sqlite3.
 */
export const float32Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType(config) {
    return `F32_BLOB(${config.dimensions})`;
  },
  fromDriver(value: Buffer) {
    return Array.from(new Float32Array(value.buffer, value.byteOffset, value.byteLength / 4));
  },
  toDriver(value: number[]) {
    return sql`vector32(${JSON.stringify(value)})`;
  },
});
