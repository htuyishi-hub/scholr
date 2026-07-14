import { Router } from "express";
import { db, scrapedItemsTable, opportunitiesTable, jobsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { runAllScrapers } from "../lib/scraper.js";
import { getUserIdFromToken } from "../lib/auth.js";

const router = Router();

function getAdminId(req: import("express").Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return getUserIdFromToken(auth.slice(7)) ?? null;
}

function generateSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) + "-" + Date.now().toString(36);
}

// POST /api/scraper/run — trigger a scrape run
router.post("/scraper/run", async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const { results, summary } = await runAllScrapers();

    let added = 0;
    let duplicates = 0;

    for (const item of results) {
      // Dedup by sourceUrl
      const [existing] = await db
        .select({ id: scrapedItemsTable.id })
        .from(scrapedItemsTable)
        .where(eq(scrapedItemsTable.sourceUrl, item.sourceUrl))
        .limit(1);

      if (existing) { duplicates++; continue; }

      await db.insert(scrapedItemsTable).values({
        source: item.source,
        sourceUrl: item.sourceUrl,
        title: item.title,
        itemType: item.itemType,
        status: "pending",
        description: item.description ?? null,
        deadline: item.deadline ?? null,
        country: item.country ?? null,
        category: item.category ?? null,
        applyLink: item.applyLink ?? null,
        rawData: item.rawData ?? {},
      });
      added++;
    }

    res.json({ added, duplicates, total: results.length, summary });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Scrape failed" });
  }
});

// GET /api/scraper/items — list scraped items (with filter)
router.get("/scraper/items", async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const { status } = req.query as { status?: "pending" | "approved" | "rejected" };
    const items = status
      ? await db.select().from(scrapedItemsTable).where(eq(scrapedItemsTable.status, status)).orderBy(desc(scrapedItemsTable.scrapedAt))
      : await db.select().from(scrapedItemsTable).orderBy(desc(scrapedItemsTable.scrapedAt));
    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// PUT /api/scraper/items/:id/approve — approve and create opportunity or job
router.put("/scraper/items/:id/approve", async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const [item] = await db.select().from(scrapedItemsTable).where(eq(scrapedItemsTable.id, req.params.id)).limit(1);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    if (item.status !== "pending") { res.status(400).json({ error: "Already reviewed" }); return; }

    // Merge overrides from request body
    const overrides = req.body as Record<string, unknown>;

    if (item.itemType === "scholarship") {
      const slug = generateSlug(String(overrides.title ?? item.title));
      const [opp] = await db.insert(opportunitiesTable).values({
        title: String(overrides.title ?? item.title),
        slug,
        description: String(overrides.description ?? item.description ?? ""),
        country: String(overrides.country ?? item.country ?? "Rwanda"),
        category: String(overrides.category ?? item.category ?? "Scholarships"),
        applyLink: String(overrides.applyLink ?? item.applyLink ?? item.sourceUrl),
        deadline: overrides.deadline ? String(overrides.deadline) : undefined,
        status: "published",
        hostOrganization: item.source,
        hostWebsite: item.sourceUrl,
        tags: ["Rwanda"],
      }).returning();

      await db.update(scrapedItemsTable).set({
        status: "approved",
        opportunityId: opp.id,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      }).where(eq(scrapedItemsTable.id, item.id));

      res.json({ created: "opportunity", id: opp.id });
    } else {
      // job
      const [job] = await db.insert(jobsTable).values({
        title: String(overrides.title ?? item.title),
        organization: item.source,
        location: String(overrides.location ?? item.country ?? "Rwanda"),
        description: String(overrides.description ?? item.description ?? ""),
        applicationLink: String(overrides.applyLink ?? item.applyLink ?? item.sourceUrl),
        deadline: overrides.deadline ? String(overrides.deadline) : undefined,
        status: "published",
        sourceType: "scraped",
        sourceUrl: item.sourceUrl,
        sourceName: item.source,
      }).returning();

      await db.update(scrapedItemsTable).set({
        status: "approved",
        jobId: job.id,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      }).where(eq(scrapedItemsTable.id, item.id));

      res.json({ created: "job", id: job.id });
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// PUT /api/scraper/items/:id/reject
router.put("/scraper/items/:id/reject", async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    await db.update(scrapedItemsTable).set({
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: adminId,
    }).where(eq(scrapedItemsTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
