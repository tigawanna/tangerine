import { db } from "@api/db/client";
import { user } from "@api/db/schema";
import { and, asc, count, desc, like, or } from "drizzle-orm";
import { Hono } from "hono";

function calculateOffset(page: number, perPage: number) {
  return (page - 1) * perPage;
}

/**
 * Reads the first row's `count` from a Drizzle `count()` select.
 */
function totalFromCountRow(row: { count: number } | undefined) {
  return row?.count ?? 0;
}

function buildPaginatedResponse<T>({
  items,
  page,
  perPage,
  totalItems,
}: {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
}) {
  return {
    items,
    pagination: {
      page,
      perPage,
      totalItems,
      totalPages: Math.ceil(totalItems / perPage),
      hasMore: page * perPage < totalItems,
    },
  };
}

export const adminRoute = new Hono()
  .get("/", (c) => c.json({ message: "ok", status: "ok" }))
  .get("/users", async (c) => {
    const { searchTerm, page, perPage, sortOrder } = c.req.query();
    const pageNum = parseInt((page as string) || "1") || 1;
    const perPageNum = parseInt((perPage as string) || "30") || 30;
    const offset = calculateOffset(pageNum, perPageNum);

    try {
      const conditions = [];

      if (searchTerm) {
        conditions.push(
          or(like(user.name, `%${searchTerm}%`), like(user.email, `%${searchTerm}%`)),
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [countRow] = await db.select({ count: count() }).from(user).where(where);
      const totalItems = totalFromCountRow(countRow);

      const items = await db
        .select()
        .from(user)
        .where(where)
        .limit(perPageNum)
        .offset(offset)
        .orderBy(sortOrder === "asc" ? asc(user.createdAt) : desc(user.createdAt));

      return c.json(
        buildPaginatedResponse({ items, page: pageNum, perPage: perPageNum, totalItems }),
      );
    } catch (error) {
      return c.json(
        {
          status: "error",
          message: error instanceof Error ? error.message : "Failed to fetch users",
        },
        500,
      );
    }
  });
