import { IR, ParsedOrderBy, parseWhereExpression } from "@tanstack/db";

type SortDirection = { asc?: string[]; desc?: string[] };

/** Flatten TanStack DB `orderBy` IR into `{ asc, desc }` field lists. */
export function parseParameterizedSorts(sorts: ParsedOrderBy[]) {
  const objectifiedSorts = sorts.reduce((acc: SortDirection, sort) => {
    if (!acc[sort.direction]) {
      return {
        [sort.direction]: sort.field,
      };
    }
    acc[sort.direction]?.push(...(sort.field as string[]));
    return acc;
  }, {});
  return objectifiedSorts;
}

export type WhereClause = {
  [key: string]: unknown;
  _and?: WhereClause[];
  _or?: WhereClause[];
};

/** Convert a live-query where IR into a shallow equality / `_and` / `_or` object. */
export function parseWhereWithHandlers<T extends WhereClause>(
  whereExression?: IR.BasicExpression<boolean>,
) {
  const where = parseWhereExpression<T>(whereExression, {
    handlers: {
      eq: (field, value) => ({ [field.join("_")]: { _eq: value } }) as T,
      and: (...conditions) => {
        return conditions.reduce((acc, condition) => {
          return { ...acc, ...condition };
        }, {} as T);
      },
      or: (...conditions) => {
        return conditions.reduce((acc, condition) => {
          return { ...acc, ...condition };
        }, {} as T);
      },
    },
  });
  return where;
}
