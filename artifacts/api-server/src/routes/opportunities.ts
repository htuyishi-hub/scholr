import { Router } from "express";
import { db, opportunitiesTable, usersTable, activityTable } from "@workspace/db";
import { eq, desc, asc, ilike, and, or, sql, inArray, lt, lte } from "drizzle-orm";
import { getUserIdFromToken } from "../lib/auth.js";

const router = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toISO(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

function mapOpp(opp: Record<string, unknown>, author?: Record<string, unknown> | null) {
  return {
    ...opp,
    deadline: opp.deadline ? String(opp.deadline) : null,
    createdAt: toISO(opp.createdAt),
    updatedAt: toISO(opp.updatedAt),
    author: author
      ? {
          ...author,
          postsCount: 0,
          lastActive: toISO((author as Record<string, unknown>).lastActive),
          createdAt: toISO((author as Record<string, unknown>).createdAt),
        }
      : null,
  };
}

// GET /api/opportunities
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 24));
    const offset = (page - 1) * limit;

    const {
      q,
      category,
      country,
      fundingType,
      status,
      deadline,
      sort = "latest",
      featured,
      authorId,
    } = req.query as Record<string, string>;

    const conditions = [];

    // If no status filter, default to published for public
    if (status) {
      conditions.push(eq(opportunitiesTable.status, status as "draft" | "published" | "archived"));
    }

    if (q) {
      conditions.push(
        or(
          ilike(opportunitiesTable.title, `%${q}%`),
          ilike(opportunitiesTable.description, `%${q}%`)
        )!
      );
    }
    if (category) conditions.push(eq(opportunitiesTable.category, category));
    if (country) conditions.push(eq(opportunitiesTable.country, country));
    if (fundingType) conditions.push(eq(opportunitiesTable.fundingType, fundingType));
    if (featured !== undefined) conditions.push(eq(opportunitiesTable.featured, featured === "true"));
    if (authorId) conditions.push(eq(opportunitiesTable.authorId, authorId));

    if (deadline === "soon") {
      const soon = new Date();
      soon.setDate(soon.getDate() + 7);
      conditions.push(lte(opportunitiesTable.deadline, soon.toISOString().slice(0, 10)));
    } else if (deadline === "this_month") {
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
      conditions.push(lte(opportunitiesTable.deadline, endOfMonth.toISOString().slice(0, 10)));
    } else if (deadline === "open") {
      const today = new Date().toISOString().slice(0, 10);
      conditions.push(sql`${opportunitiesTable.deadline} >= ${today}`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    if (sort === "deadline_soonest") orderBy = asc(opportunitiesTable.deadline);
    else if (sort === "most_viewed") orderBy = desc(opportunitiesTable.views);
    else orderBy = desc(opportunitiesTable.createdAt);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(opportunitiesTable)
      .where(where);

    const opps = await db
      .select()
      .from(opportunitiesTable)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Load authors
    const authorIds = [...new Set(opps.map((o) => o.authorId).filter(Boolean))] as string[];
    const authors =
      authorIds.length > 0
        ? await db.select().from(usersTable).where(inArray(usersTable.id, authorIds))
        : [];
    const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]));

    const items = opps.map((o) => mapOpp(o as Record<string, unknown>, o.authorId ? authorMap[o.authorId] as Record<string, unknown> : null));

    res.json({
      items,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/opportunities/featured
router.get("/featured", async (req, res) => {
  try {
    const opps = await db
      .select()
      .from(opportunitiesTable)
      .where(and(eq(opportunitiesTable.featured, true), eq(opportunitiesTable.status, "published")))
      .orderBy(desc(opportunitiesTable.createdAt))
      .limit(3);

    const authorIds = [...new Set(opps.map((o) => o.authorId).filter(Boolean))] as string[];
    const authors =
      authorIds.length > 0
        ? await db.select().from(usersTable).where(inArray(usersTable.id, authorIds))
        : [];
    const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]));

    res.json(opps.map((o) => mapOpp(o as Record<string, unknown>, o.authorId ? authorMap[o.authorId] as Record<string, unknown> : null)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/opportunities/stats
router.get("/stats", async (req, res) => {
  try {
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(opportunitiesTable)
      .where(eq(opportunitiesTable.status, "published"));

    const countriesResult = await db
      .selectDistinct({ country: opportunitiesTable.country })
      .from(opportunitiesTable)
      .where(and(eq(opportunitiesTable.status, "published"), sql`${opportunitiesTable.country} IS NOT NULL`));

    const today = new Date().toISOString().slice(0, 10);
    const [{ updated }] = await db
      .select({ updated: sql<number>`count(*)::int` })
      .from(opportunitiesTable)
      .where(sql`DATE(${opportunitiesTable.updatedAt}) = ${today}`);

    res.json({
      totalOpportunities: total,
      totalCountries: countriesResult.length,
      updatedToday: updated,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/opportunities/slug/:slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const [opp] = await db
      .select()
      .from(opportunitiesTable)
      .where(eq(opportunitiesTable.slug, req.params.slug))
      .limit(1);
    if (!opp) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    let author = null;
    if (opp.authorId) {
      const [a] = await db.select().from(usersTable).where(eq(usersTable.id, opp.authorId)).limit(1);
      author = a;
    }
    res.json(mapOpp(opp as Record<string, unknown>, author as Record<string, unknown> | null));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/opportunities/:id
router.get("/:id", async (req, res) => {
  try {
    const [opp] = await db
      .select()
      .from(opportunitiesTable)
      .where(eq(opportunitiesTable.id, req.params.id))
      .limit(1);
    if (!opp) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    let author = null;
    if (opp.authorId) {
      const [a] = await db.select().from(usersTable).where(eq(usersTable.id, opp.authorId)).limit(1);
      author = a;
    }
    res.json(mapOpp(opp as Record<string, unknown>, author as Record<string, unknown> | null));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/opportunities
router.post("/", async (req, res) => {
  const auth = req.headers.authorization;
  let authorId: string | undefined;
  if (auth?.startsWith("Bearer ")) {
    const { getUserIdFromToken: getUser } = await import("../lib/auth.js");
    authorId = getUser(auth.slice(7));
  }

  try {
    const body = req.body as Record<string, unknown>;
    const title = String(body.title || "");
    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    let slug = slugify(title);
    // Ensure unique slug
    const existing = await db
      .select({ slug: opportunitiesTable.slug })
      .from(opportunitiesTable)
      .where(ilike(opportunitiesTable.slug, `${slug}%`));
    if (existing.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const [opp] = await db
      .insert(opportunitiesTable)
      .values({
        title,
        slug,
        description: body.description as string | null ?? null,
        content: body.content as string | null ?? null,
        coverImage: body.coverImage as string | null ?? null,
        category: body.category as string | null ?? null,
        country: body.country as string | null ?? null,
        fundingType: body.fundingType as string | null ?? null,
        studyLevel: body.studyLevel as string[] | null ?? null,
        deadline: body.deadline as string | null ?? null,
        amount: body.amount as string | null ?? null,
        applyLink: body.applyLink as string | null ?? null,
        whatsappNumber: body.whatsappNumber as string | null ?? null,
        tags: body.tags as string[] | null ?? null,
        status: (body.status as "draft" | "published" | "archived") ?? "draft",
        featured: Boolean(body.featured),
        pinned: Boolean(body.pinned),
        seoTitle: body.seoTitle as string | null ?? null,
        metaDescription: body.metaDescription as string | null ?? null,
        authorId: authorId ?? null,
        requiredDocuments: body.requiredDocuments as string[] | null ?? null,
      })
      .returning();

    // Log activity
    if (authorId) {
      const [author] = await db.select().from(usersTable).where(eq(usersTable.id, authorId)).limit(1);
      if (author) {
        await db.insert(activityTable).values({
          action: "created",
          opportunityId: opp.id,
          opportunityTitle: opp.title,
          authorId,
          authorName: author.name,
        });
      }
    }

    let author = null;
    if (opp.authorId) {
      const [a] = await db.select().from(usersTable).where(eq(usersTable.id, opp.authorId)).limit(1);
      author = a;
    }
    res.status(201).json(mapOpp(opp as Record<string, unknown>, author as Record<string, unknown> | null));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/opportunities/:id
router.put("/:id", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const [opp] = await db
      .update(opportunitiesTable)
      .set({
        ...(body.title !== undefined && { title: body.title as string }),
        ...(body.description !== undefined && { description: body.description as string | null }),
        ...(body.content !== undefined && { content: body.content as string | null }),
        ...(body.coverImage !== undefined && { coverImage: body.coverImage as string | null }),
        ...(body.category !== undefined && { category: body.category as string | null }),
        ...(body.country !== undefined && { country: body.country as string | null }),
        ...(body.fundingType !== undefined && { fundingType: body.fundingType as string | null }),
        ...(body.studyLevel !== undefined && { studyLevel: body.studyLevel as string[] | null }),
        ...(body.deadline !== undefined && { deadline: body.deadline as string | null }),
        ...(body.amount !== undefined && { amount: body.amount as string | null }),
        ...(body.applyLink !== undefined && { applyLink: body.applyLink as string | null }),
        ...(body.whatsappNumber !== undefined && { whatsappNumber: body.whatsappNumber as string | null }),
        ...(body.tags !== undefined && { tags: body.tags as string[] | null }),
        ...(body.status !== undefined && { status: body.status as "draft" | "published" | "archived" }),
        ...(body.featured !== undefined && { featured: Boolean(body.featured) }),
        ...(body.pinned !== undefined && { pinned: Boolean(body.pinned) }),
        ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle as string | null }),
        ...(body.metaDescription !== undefined && { metaDescription: body.metaDescription as string | null }),
        ...(body.requiredDocuments !== undefined && { requiredDocuments: body.requiredDocuments as string[] | null }),
        updatedAt: new Date(),
      })
      .where(eq(opportunitiesTable.id, req.params.id))
      .returning();

    if (!opp) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    // Log activity
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      const userId = getUserIdFromToken(auth.slice(7));
      if (userId) {
        const [author] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
        if (author) {
          await db.insert(activityTable).values({
            action: "updated",
            opportunityId: opp.id,
            opportunityTitle: opp.title,
            authorId: userId,
            authorName: author.name,
          });
        }
      }
    }

    let author = null;
    if (opp.authorId) {
      const [a] = await db.select().from(usersTable).where(eq(usersTable.id, opp.authorId)).limit(1);
      author = a;
    }
    res.json(mapOpp(opp as Record<string, unknown>, author as Record<string, unknown> | null));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/opportunities/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.delete(opportunitiesTable).where(eq(opportunitiesTable.id, req.params.id));
    res.json({ message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/opportunities/:id/view
router.post("/:id/view", async (req, res) => {
  try {
    await db
      .update(opportunitiesTable)
      .set({ views: sql`${opportunitiesTable.views} + 1` })
      .where(eq(opportunitiesTable.id, req.params.id));
    res.json({ message: "View counted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/opportunities/:id/related
router.get("/:id/related", async (req, res) => {
  try {
    const [opp] = await db
      .select()
      .from(opportunitiesTable)
      .where(eq(opportunitiesTable.id, req.params.id))
      .limit(1);
    if (!opp) {
      res.json([]);
      return;
    }

    const conditions = [
      eq(opportunitiesTable.status, "published"),
      sql`${opportunitiesTable.id} != ${opp.id}`,
    ];
    if (opp.category) conditions.push(eq(opportunitiesTable.category, opp.category));

    const related = await db
      .select()
      .from(opportunitiesTable)
      .where(and(...conditions))
      .orderBy(desc(opportunitiesTable.createdAt))
      .limit(3);

    res.json(related.map((o) => mapOpp(o as Record<string, unknown>, null)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/opportunities/bulk
router.post("/bulk", async (req, res) => {
  try {
    const { ids, action } = req.body as { ids: string[]; action: string };
    if (!ids?.length) {
      res.status(400).json({ error: "No IDs provided" });
      return;
    }

    if (action === "delete") {
      await db.delete(opportunitiesTable).where(inArray(opportunitiesTable.id, ids));
    } else if (action === "publish") {
      await db.update(opportunitiesTable).set({ status: "published" }).where(inArray(opportunitiesTable.id, ids));
    } else if (action === "archive") {
      await db.update(opportunitiesTable).set({ status: "archived" }).where(inArray(opportunitiesTable.id, ids));
    }

    res.json({ message: `Bulk ${action} completed` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
