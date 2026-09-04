/** Metadata describing a page of offset/limit list results. */
export type PaginationMeta = {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
};

/** Standard offset/limit paginated list payload. */
export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};

/**
 * Builds a standard `{ items, pagination }` list response.
 */
export function buildPaginatedResponse<T>({
  items,
  page,
  perPage,
  totalItems,
}: {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
}): PaginatedResponse<T> {
  const safePage = Math.max(1, page);
  const safePerPage = Math.max(1, perPage);
  const safeTotal = Math.max(0, totalItems);

  return {
    items,
    pagination: {
      page: safePage,
      perPage: safePerPage,
      totalItems: safeTotal,
      totalPages: Math.ceil(safeTotal / safePerPage) || 1,
      hasMore: safePage * safePerPage < safeTotal,
    },
  };
}

/**
 * Slices an in-memory list into a standard `{ items, pagination }` page.
 *
 * @param items - Full (already filtered/sorted) list.
 * @param page - 1-based page index.
 * @param perPage - Page size.
 */
export function paginateItems<T>(items: T[], page: number, perPage: number): PaginatedResponse<T> {
  const safePerPage = Math.max(1, Math.trunc(perPage));
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePerPage));
  const safePage = Math.min(Math.max(1, Math.trunc(page)), totalPages);
  const start = (safePage - 1) * safePerPage;

  return buildPaginatedResponse({
    items: items.slice(start, start + safePerPage),
    page: safePage,
    perPage: safePerPage,
    totalItems,
  });
}
