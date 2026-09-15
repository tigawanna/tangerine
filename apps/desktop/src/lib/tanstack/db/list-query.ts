import { ilike, or } from "@tanstack/db";

/** Default page size for TanStack DB live-query lists. */
export const LIST_PER_PAGE = 50;

type IlikeField = Parameters<typeof ilike>[0];

/** SQL LIKE pattern for a committed search string. */
export function keywordPattern(q: string) {
  return `%${q.trim()}%`;
}

/**
 * Case-insensitive OR across query field refs. Skip when `q` is empty.
 */
export function orIlike(q: string, first: IlikeField, second: IlikeField, ...rest: IlikeField[]) {
  const pattern = keywordPattern(q);
  return or(
    ilike(first, pattern),
    ilike(second, pattern),
    ...rest.map((field) => ilike(field, pattern)),
  );
}

/** Offset for 1-based page numbers. */
export function listOffset(page: number, perPage = LIST_PER_PAGE) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  return (safePage - 1) * perPage;
}

/** Page count from a live-query `count()` total. */
export function totalPagesFromCount(totalItems: number, perPage = LIST_PER_PAGE) {
  if (totalItems <= 0) return 0;
  return Math.ceil(totalItems / perPage);
}
