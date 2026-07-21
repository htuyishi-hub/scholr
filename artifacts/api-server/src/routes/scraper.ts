import { Router } from "express";
import { db, scrapedItemsTable, opportunitiesTable, jobsTable } from "@workspace/db";
import { eq, desc, like, sql } from "drizzle-orm";
import { runAllScrapers, getSourceCount, getScrapersByCategory } from "../lib/scrapers/index.js";
import { getUserIdFromToken } from "../lib/auth.js";

const router = Router();

// ── Helpers ──────────────────────────────────────────────

async function getAdminId(req: import("express").Request): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return (await getUserIdFromToken(auth.slice(7))) ?? null;
}

/**
 * Generate a clean, human-readable slug.
 * If the slug already exists in opportunities, appends -2, -3 etc.
 */
async function generateUniqueSlug(
  title: string,
): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  if (!base) return "opportunity";

  // Check if base slug exists
  const existing = await db
    .select({ slug: opportunitiesTable.slug })
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.slug, base))
    .limit(1);

  if (!existing.length) return base;

  // Append incrementing suffix
  let i = 2;
  while (true) {
    const candidate = `${base}-${i}`;
    const exists = await db
      .select({ slug: opportunitiesTable.slug })
      .from(opportunitiesTable)
      .where(eq(opportunitiesTable.slug, candidate))
      .limit(1);
    if (!exists.length) return candidate;
    i++;
  }
}

function createPreview(plainText?: string | null, maxChars = 200): string {
  if (!plainText) return "";
  const cleaned = plainText.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxChars) return cleaned;
  return cleaned.slice(0, maxChars).replace(/\s+\S*$/, "").trim() + "…";
}

/**
 * Multi-level duplicate check before inserting scraped item.
 */
async function isDuplicate(
  sourceUrl: string,
  applyLink?: string | null,
  title?: string | null,
): Promise<boolean> {
  // Level 1: exact sourceUrl already scraped
  const byUrl = await db
    .select({ id: scrapedItemsTable.id })
    .from(scrapedItemsTable)
    .where(eq(scrapedItemsTable.sourceUrl, sourceUrl))
    .limit(1);
  if (byUrl.length) return true;

  // Level 2: same applyLink already published as opportunity
  if (applyLink) {
    const byApply = await db
      .select({ id: opportunitiesTable.id })
      .from(opportunitiesTable)
      .where(eq(opportunitiesTable.applyLink, applyLink))
      .limit(1);
    if (byApply.length) return true;
  }

  // Level 3: normalized title match in published opportunities
  if (title) {
    const normalized = title.trim().toLowerCase().slice(0, 100);
    const byTitle = await db
      .select({ id: opportunitiesTable.id })
      .from(opportunitiesTable)
      .where(like(opportunitiesTable.title, `%${normalized}%`))
      .limit(1);
    if (byTitle.length) return true;
  }

  return false;
}

// ── Routes ───────────────────────────────────────────────

// GET /api/scraper/status — get scraper configuration info
router.get("/scraper/status", (_req, res) => {
  res.json({
    totalSources: getSourceCount(),
    categories: Object.fromEntries(
      Object.entries(getScrapersByCategory()).map(([cat, scrapers]) => [
        cat,
        scrapers.map((s: { name: string; enabled: boolean; priority: number }) => ({
          name: s.name,
          enabled: s.enabled,
          priority: s.priority,
        })),
      ])
    ),
  });
});

// POST /api/scraper/run — trigger a scrape run
router.post("/scraper/run", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const startedAt = new Date().toISOString();

  try {
    const { results, summary } = await runAllScrapers();

    let added = 0;
    let duplicates = 0;
    let failed = 0;

    for (const item of results) {
      const dup = await isDuplicate(item.sourceUrl, item.applyLink, item.title);
      if (dup) { duplicates++; continue; }

      try {
        await db.insert(scrapedItemsTable).values({
          source: item.source,
          sourceUrl: item.sourceUrl,
          title: item.title,
          itemType: item.itemType,
          status: "pending",
          description: item.plainText ? createPreview(item.plainText) : (item.description ?? null),
          content: item.content ?? null,
          plainText: item.plainText ?? null,
          coverImage: item.images?.[0] ?? null,
          images: item.images ?? null,
          deadline: item.deadline ?? null,
          country: item.country ?? null,
          category: item.category ?? null,
          applyLink: item.applyLink ?? null,
          scraperName: item.source,
          rawData: {
            ...(item.rawData ?? {}),
            images: item.images,
          },
        });
        added++;
      } catch {
        failed++;
      }
    }

    res.json({
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: summary.durationMs,
      total: results.length,
      added,
      duplicates,
      failed: failed + summary.errors.length,
      pending: added,
      approved: 0,
      rejected: 0,
      sourcesRun: summary.enabledSources,
      sourcesSucceeded: summary.scraperResults.filter((s) => s.success).length,
      sourcesFailed: summary.scraperResults.filter((s) => !s.success).length,
      errors: summary.errors,
      scraperResults: summary.scraperResults.map((sr) => ({
        name: sr.name,
        count: sr.count,
        duration: sr.duration,
        success: sr.success,
        error: sr.error,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      startedAt,
      finishedAt: new Date().toISOString(),
      error: "Scrape failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

// GET /api/scraper/items — list scraped items (with optional status filter)
router.get("/scraper/items", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const { status } = req.query as { status?: "pending" | "approved" | "rejected" };
    const items = status
      ? await db
          .select()
          .from(scrapedItemsTable)
          .where(eq(scrapedItemsTable.status, status))
          .orderBy(desc(scrapedItemsTable.scrapedAt))
      : await db
          .select()
          .from(scrapedItemsTable)
          .orderBy(desc(scrapedItemsTable.scrapedAt));
    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// GET /api/scraper/items/:id — get single item with full rich content
router.get("/scraper/items/:id", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const [item] = await db
      .select()
      .from(scrapedItemsTable)
      .where(eq(scrapedItemsTable.id, req.params.id))
      .limit(1);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// PUT /api/scraper/items/:id/approve — approve and create opportunity or job
router.put("/scraper/items/:id/approve", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const [item] = await db
      .select()
      .from(scrapedItemsTable)
      .where(eq(scrapedItemsTable.id, req.params.id))
      .limit(1);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    if (item.status !== "pending") { res.status(400).json({ error: "Already reviewed" }); return; }

    // Merge overrides from request body (admin edits)
    const body = req.body as Record<string, unknown>;
    const title = String(body.title ?? item.title);
    const description = createPreview(String(body.plainText ?? item.plainText ?? ""));
    const content = String(body.content ?? item.content ?? "");
    const coverImage = String(body.coverImage ?? item.coverImage ?? "");
    const applyLink = String(body.applyLink ?? item.applyLink ?? item.sourceUrl);
    const deadline = body.deadline ? String(body.deadline) : (item.deadline ?? undefined);
    const category = String(body.category ?? item.category ?? "Scholarships");
    const country = String(body.country ?? item.country ?? "Rwanda");
    const tags = body.tags ? (body.tags as string[]) : (item.category ? [item.category] : ["Rwanda"]);
    const images = body.images ? (body.images as string[]) : (item.images ?? []);
    const galleryImages = images.length ? images : null;

    // Atomic transaction
    await db.transaction(async (tx: any) => {
      if (item.itemType === "scholarship") {
        const slug = await generateUniqueSlug(title);

        const [opp] = await tx
          .insert(opportunitiesTable)
          .values({
            title,
            slug,
            description,
            content,
            coverImage: coverImage || item.coverImage || null,
            galleryImages,
            country,
            category,
            applyLink,
            deadline: deadline as string | undefined,
            status: "published",
            hostOrganization: item.source,
            hostWebsite: item.sourceUrl,
            tags: tags.length ? tags : ["Rwanda"],
          })
          .returning();

        await tx
          .update(scrapedItemsTable)
          .set({
            status: "approved",
            opportunityId: opp.id,
            reviewedAt: new Date(),
            reviewedBy: adminId,
          })
          .where(eq(scrapedItemsTable.id, item.id));

        res.json({ created: "opportunity", id: opp.id, slug: opp.slug });
      } else {
        // Job
        const [job] = await tx
          .insert(jobsTable)
          .values({
            title,
            organization: String(body.organization ?? item.source),
            location: country,
            description,
            content: content || null,
            coverImage: coverImage || item.coverImage || null,
            galleryImages,
            applicationLink: applyLink,
            deadline: deadline as string | undefined,
            status: "published",
            sourceType: "scraped",
            sourceUrl: item.sourceUrl,
            sourceName: item.source,
          })
          .returning();

        await tx
          .update(scrapedItemsTable)
          .set({
            status: "approved",
            jobId: job.id,
            reviewedAt: new Date(),
            reviewedBy: adminId,
          })
          .where(eq(scrapedItemsTable.id, item.id));

        res.json({ created: "job", id: job.id });
      }
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({
      error: "Internal error",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

// PUT /api/scraper/items/:id/reject
router.put("/scraper/items/:id/reject", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    await db
      .update(scrapedItemsTable)
      .set({
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: adminId,
      })
      .where(eq(scrapedItemsTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// GET /api/scraper/stats — aggregate statistics
router.get("/scraper/stats", (_req, res) => {
  (async () => {
    try {
      const [pending] = await db
        .select({ count: sql<number>`count(*)` })
        .from(scrapedItemsTable)
        .where(eq(scrapedItemsTable.status, "pending"));

      const [approved] = await db
        .select({ count: sql<number>`count(*)` })
        .from(scrapedItemsTable)
        .where(eq(scrapedItemsTable.status, "approved"));

      const [rejected] = await db
        .select({ count: sql<number>`count(*)` })
        .from(scrapedItemsTable)
        .where(eq(scrapedItemsTable.status, "rejected"));

      const [published] = await db
        .select({ count: sql<number>`count(*)` })
        .from(opportunitiesTable)
        .where(eq(opportunitiesTable.status, "published"));

      res.json({
        scrapedItems: {
          pending: Number(pending.count),
          approved: Number(approved.count),
          rejected: Number(rejected.count),
          total: Number(pending.count) + Number(approved.count) + Number(rejected.count),
        },
        publishedOpportunities: Number(published.count),
        totalSources: getSourceCount(),
      });
    } catch (err) {
      res.status(500).json({ error: "Internal error", detail: err instanceof Error ? err.message : String(err) });
    }
  })();
});

export default router;
