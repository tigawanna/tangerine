import { Hono } from "hono";
import { z } from "zod";
import { db } from "@api/db/client";
import { account, apikey, cuisineType, customerFavorite, customerLocation, invitation, kitchenProfile, kitchenCuisine, member, menuCategory, menuItem, organization, session, user, verification, } from "@api/db/schema";
const tables = {
    account,
    apikey,
    cuisineType,
    customerFavorite,
    customerLocation,
    invitation,
    kitchenProfile,
    kitchenCuisine,
    member,
    menuCategory,
    menuItem,
    organization,
    session,
    user,
    verification,
};
function listCrudTables() {
    return Object.keys(tables);
}
function getCrudTable(tableName) {
    const table = tables[tableName];
    if (!table)
        return undefined;
    return { table, searchOn: ["name", "slug"] };
}
const createBodySchema = z.record(z.string(), z.unknown());
const updateBodySchema = z.record(z.string(), z.unknown()).optional().default({});
function calculateOffset(page, perPage) {
    return (page - 1) * perPage;
}
function buildPaginatedResponse({ items, page, perPage, totalItems, }) {
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
export const crudRoute = new Hono()
    .get("/api/crud", (c) => {
    return c.json({ tables: listCrudTables() });
})
    .get("/api/crud/:table", async (c) => {
    const tableName = c.req.param("table");
    const config = getCrudTable(tableName);
    if (!config) {
        return c.json({ error: "Table not found", table: tableName }, 404);
    }
    const { page = 1, perPage = 30 } = c.req.query();
    const pageNum = parseInt(page) || 1;
    const perPageNum = parseInt(perPage) || 30;
    const offset = calculateOffset(pageNum, perPageNum);
    try {
        const items = await db.select().from(config.table).limit(perPageNum).offset(offset);
        return c.json(buildPaginatedResponse({ items, page: pageNum, perPage: perPageNum, totalItems: items.length }));
    }
    catch (err) {
        return c.json({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
    }
})
    .get("/api/crud/:table/:id", async (c) => {
    const tableName = c.req.param("table");
    const id = c.req.param("id");
    const config = getCrudTable(tableName);
    if (!config) {
        return c.json({ error: "Table not found", table: tableName }, 404);
    }
    try {
        const [item] = await db.select().from(config.table).where(config.table.id.eq(id)).limit(1);
        if (!item) {
            return c.json({ error: "Not found", id }, 404);
        }
        return c.json({ item });
    }
    catch (err) {
        return c.json({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
    }
})
    .post("/api/crud/:table", async (c) => {
    const tableName = c.req.param("table");
    const raw = await c.req.json();
    const config = getCrudTable(tableName);
    if (!config) {
        return c.json({ error: "Table not found", table: tableName }, 404);
    }
    try {
        const result = await db.insert(config.table).values(raw).returning();
        const item = Array.isArray(result) ? result[0] : null;
        return c.json({ item }, 201);
    }
    catch (err) {
        return c.json({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
    }
})
    .patch("/api/crud/:table/:id", async (c) => {
    const tableName = c.req.param("table");
    const id = c.req.param("id");
    const raw = await c.req.json();
    const config = getCrudTable(tableName);
    if (!config) {
        return c.json({ error: "Table not found", table: tableName }, 404);
    }
    try {
        const result = await db.update(config.table).set(raw).where(config.table.id.eq(id)).returning();
        const item = Array.isArray(result) ? result[0] : null;
        if (!item) {
            return c.json({ error: "Not found", id }, 404);
        }
        return c.json({ item });
    }
    catch (err) {
        return c.json({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
    }
})
    .delete("/api/crud/:table/:id", async (c) => {
    const tableName = c.req.param("table");
    const id = c.req.param("id");
    const config = getCrudTable(tableName);
    if (!config) {
        return c.json({ error: "Table not found", table: tableName }, 404);
    }
    try {
        const result = await db.delete(config.table).where(config.table.id.eq(id)).returning();
        const item = Array.isArray(result) ? result[0] : null;
        if (!item) {
            return c.json({ error: "Not found", id }, 404);
        }
        return c.json({ item });
    }
    catch (err) {
        return c.json({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
    }
});
