import { Router } from "express";
import { db, opportunitiesTable, usersTable, activityTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

// GET /api/dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(opportunitiesTable);

    const [{ published }] = await db
      .select({ published: sql<number>`count(*)::int` })
      .from(opportunitiesTable)
      .where(eq(opportunitiesTable.status, "published"));

    const [{ drafts }] = await db
      .select({ drafts: sql<number>`count(*)::int` })
      .from(opportunitiesTable)
      .where(eq(opportunitiesTable.status, "draft"));

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const [{ thisMonth }] = await db
      .select({ thisMonth: sql<number>`count(*)::int` })
      .from(opportunitiesTable)
      .where(sql`${opportunitiesTable.createdAt} >= ${startOfMonth}`);

    const [{ totalViews }] = await db
      .select({ totalViews: sql<number>`COALESCE(SUM(views), 0)::int` })
      .from(opportunitiesTable);

    const [{ teamMembers }] = await db
      .select({ teamMembers: sql<number>`count(*)::int` })
      .from(usersTable);

    res.json({
      totalPosts: total,
      publishedPosts: published,
      draftPosts: drafts,
      thisMonthPosts: thisMonth,
      totalViews,
      teamMembers,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/activity
router.get("/activity", async (req, res) => {
  try {
    const activities = await db
      .select()
      .from(activityTable)
      .orderBy(desc(activityTable.createdAt))
      .limit(20);

    res.json(
      activities.map((a) => ({
        id: a.id,
        action: a.action,
        opportunityTitle: a.opportunityTitle,
        authorName: a.authorName,
        createdAt: a.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/top-posts
router.get("/top-posts", async (req, res) => {
  try {
    const posts = await db
      .select()
      .from(opportunitiesTable)
      .orderBy(desc(opportunitiesTable.views))
      .limit(5);

    res.json(
      posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        views: p.views,
        status: p.status,
        featured: p.featured,
        pinned: p.pinned,
        coverImage: p.coverImage,
        country: p.country,
        deadline: p.deadline ? String(p.deadline) : null,
        description: p.description,
        content: p.content,
        fundingType: p.fundingType,
        studyLevel: p.studyLevel,
        amount: p.amount,
        applyLink: p.applyLink,
        whatsappNumber: p.whatsappNumber,
        tags: p.tags,
        authorId: p.authorId,
        author: null,
        seoTitle: p.seoTitle,
        metaDescription: p.metaDescription,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/posts-by-month
router.get("/posts-by-month", async (req, res) => {
  try {
    const rows = await db
      .select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${opportunitiesTable.createdAt}), 'Mon YYYY')`,
        count: sql<number>`count(*)::int`,
      })
      .from(opportunitiesTable)
      .where(sql`${opportunitiesTable.createdAt} >= NOW() - INTERVAL '6 months'`)
      .groupBy(sql`DATE_TRUNC('month', ${opportunitiesTable.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${opportunitiesTable.createdAt})`);

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/views-by-category
router.get("/views-by-category", async (req, res) => {
  try {
    const rows = await db
      .select({
        category: opportunitiesTable.category,
        views: sql<number>`COALESCE(SUM(${opportunitiesTable.views}), 0)::int`,
      })
      .from(opportunitiesTable)
      .where(sql`${opportunitiesTable.category} IS NOT NULL`)
      .groupBy(opportunitiesTable.category)
      .orderBy(sql`SUM(${opportunitiesTable.views}) DESC`);

    res.json(rows.map((r) => ({ category: r.category!, views: r.views })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
