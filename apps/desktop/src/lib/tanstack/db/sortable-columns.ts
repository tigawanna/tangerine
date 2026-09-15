import { Collection } from "@tanstack/db";

/**
 * Extracts the schema type from a TanStack DB Collection.
 */
export type CollectionSchema<T> = T extends Collection<infer S extends object, string | number>
  ? S
  : never;

/**
 * Keys (column names) from a collection schema as a string union.
 */
export type CollectionColumns<T> = keyof CollectionSchema<T> & string;

/**
 * One sortable column: schema key + label shown in the sort UI.
 */
export interface ColumnConfig<TColumn extends string> {
  /** Database column key from the collection schema. */
  value: TColumn;
  /** Label displayed in the sort dropdown. */
  label: string;
}

/**
 * Type-enforces sortable column configs against a collection schema.
 *
 * Pair with `TanstackDBColumnFilters` / `TanstackDBSortSelect` and route
 * `validateSearch` that includes `sortBy` + `sortDirection`.
 */
export function createSortableColumns<
  TCollection extends Collection<object, string | number>,
  TColumns extends CollectionColumns<TCollection>,
>(_collection: TCollection, columns: Array<ColumnConfig<TColumns>>): Array<ColumnConfig<TColumns>> {
  return columns;
}
