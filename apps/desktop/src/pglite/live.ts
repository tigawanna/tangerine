import type {
  Change,
  LiveChanges,
  LiveQuery,
  LiveQueryResults,
} from "@electric-sql/pglite/live";
import { client } from "./client";

/**
 * Drizzle builders expose `.toSQL()` → `{ sql, params }` for the live API.
 * @see https://orm.drizzle.team/docs/goodies#printing-sql-query
 * @see https://pglite.dev/docs/live-queries
 */
export type DrizzleStatement = {
  toSQL(): { sql: string; params: unknown[] };
};

/** Row type inferred from `await db.select()…` / `await db.query.x.findMany()`. */
export type LiveRowOf<T extends DrizzleStatement> =
  T extends PromiseLike<infer Result>
    ? Result extends ReadonlyArray<infer Row>
      ? Row
      : NonNullable<Result>
    : never;

export type LiveWindow = {
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
};

/**
 * Live-subscribe to a Drizzle query. Forwards `.toSQL()` into `client.live.query`.
 *
 * @example
 * ```ts
 * const sub = await liveQuery(
 *   db.select().from(projectEnrichmentOutputs).where(eq(…)),
 *   (res) => console.log(res.rows),
 * );
 * await sub.unsubscribe();
 * ```
 */
export function liveQuery<T extends DrizzleStatement & PromiseLike<unknown>>(
  statement: T,
  onResults?: (results: LiveQueryResults<LiveRowOf<T>>) => void,
  window?: LiveWindow,
): Promise<LiveQuery<LiveRowOf<T>>> {
  const { sql, params } = statement.toSQL();

  if (window) {
    return client.live.query({
      query: sql,
      params,
      offset: window.offset,
      limit: window.limit,
      signal: window.signal,
      callback: onResults,
    });
  }

  return client.live.query(sql, params, onResults);
}

/**
 * Incremental live query — diffs by `key` (usually a primary key column name).
 * Prefer for large / wide result sets.
 */
export function liveIncrementalQuery<T extends DrizzleStatement & PromiseLike<unknown>>(
  statement: T,
  key: keyof LiveRowOf<T> & string,
  onResults?: (results: LiveQueryResults<LiveRowOf<T>>) => void,
): Promise<LiveQuery<LiveRowOf<T>>> {
  const { sql, params } = statement.toSQL();
  return client.live.incrementalQuery(sql, params, key, onResults);
}

/**
 * Lower-level change stream (`INSERT` / `UPDATE` / `DELETE`) keyed by `key`.
 */
export function liveChanges<T extends DrizzleStatement & PromiseLike<unknown>>(
  statement: T,
  key: keyof LiveRowOf<T> & string,
  onChanges?: (changes: Array<Change<LiveRowOf<T>>>) => void,
): Promise<LiveChanges<LiveRowOf<T>>> {
  const { sql, params } = statement.toSQL();
  return client.live.changes(sql, params, key, onChanges);
}
