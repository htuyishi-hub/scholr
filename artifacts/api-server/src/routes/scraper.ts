import { Router } from "express";
import { db, scrapedItemsTable, opportunitiesTable, jobsTable } from "@workspace/db";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { runAllScrapers, getSourceCount, getScrapersByCategory } from "../lib/scrapers/index.js";
import { enrichResults } from "../lib/scrapers/detailExtractor.js";
import pLimit from "p-limit";
import { getUserIdFromToken } from "../lib/auth.js";
import type { ScrapedResult } from "../lib/scrapers/types.js";
import { htmlToPlainText } from "../lib/scrapers/types.js";
import type { AuditEvent, QualityIssue } from "@workspace/db";

const router = Router();

// ── Helpers ──────────────────────────────────────────────

async function getAdminId(req: import("express").Request): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return (await getUserIdFromToken(auth.slice(7))) ?? null;
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  if (!base) return "opportunity";

  const existing = await db
    .select({ slug: opportunitiesTable.slug })
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.slug, base))
    .limit(1);

  if (!existing.length) return base;

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
  return cleaned.slice(0, maxChars).replace(/\s+\S*$/, "").trim() + "\u2026";
}

/**
 * Batch-check which sourceUrls already exist in scraped_items.
 * Queries in chunks (Postgres has a bind-parameter limit) and surfaces any
 * query error instead of silently pretending there are no duplicates.
 */
async function getExistingUrls(
  urls: string[],
): Promise<{ known: Set<string>; error?: string }> {
  const known = new Set<string>();
  if (!urls.length) return { known };
  const CHUNK = 400;
  try {
    for (let i = 0; i < urls.length; i += CHUNK) {
      const rows = await db
        .select({ sourceUrl: scrapedItemsTable.sourceUrl })
        .from(scrapedItemsTable)
        .where(inArray(scrapedItemsTable.sourceUrl, urls.slice(i, i + CHUNK)));
      for (const r of rows as { sourceUrl: string }[]) known.add(r.sourceUrl);
    }
    return { known };
  } catch (err) {
    return { known, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Compute a 0-100 quality score from item fields. */
function computeQualityScore(item: Record<string, unknown>): {
  score: number;
  issues: QualityIssue[];
} {
  const issues: QualityIssue[] = [];
  let score = 0;

  const title = item.title as string | null;
  const description = item.description as string | null;
  const plainText = item.plain_text as string | null ?? item.plainText as string | null;
  const coverImage = item.cover_image as string | null ?? item.coverImage as string | null;
  const applyLink = item.apply_link as string | null ?? item.applyLink as string | null;
  const deadline = item.deadline as string | null;
  const country = item.country as string | null;
  const category = item.category as string | null;
  const images = item.images as string[] | null;

  // Title (15 pts)
  if (title && title.length >= 10 && title.length <= 200) {
    score += 15;
    issues.push({ check: "title", status: "pass", message: "Title is well-formed" });
  } else if (title) {
    score += 7;
    issues.push({ check: "title", status: "warn", message: "Title may be too short or long", recommendation: "Aim for 10–200 characters" });
  } else {
    issues.push({ check: "title", status: "fail", message: "No title found", recommendation: "Add a descriptive title" });
  }

  // Description (10 pts)
  if (description && description.length > 100) {
    score += 10;
    issues.push({ check: "description", status: "pass", message: "Description present" });
  } else if (description) {
    score += 5;
    issues.push({ check: "description", status: "warn", message: "Description is too short", recommendation: "Expand to at least 100 characters" });
  } else {
    issues.push({ check: "description", status: "fail", message: "No description", recommendation: "Add a concise summary" });
  }

  // Content (20 pts)
  const contentLen = plainText?.length ?? 0;
  if (contentLen > 500) {
    score += 20;
    issues.push({ check: "content", status: "pass", message: `Rich content available (${contentLen} chars)` });
  } else if (contentLen > 100) {
    score += 10;
    issues.push({ check: "content", status: "warn", message: "Content is thin", recommendation: "Re-enrich or manually add content" });
  } else {
    issues.push({ check: "content", status: "fail", message: "No content extracted", recommendation: "Re-enrich or manually add content" });
  }

  // Cover image (15 pts)
  if (coverImage) {
    score += 15;
    issues.push({ check: "cover_image", status: "pass", message: "Cover image available" });
  } else {
    issues.push({ check: "cover_image", status: "fail", message: "No cover image", recommendation: "Select an image or assign a category placeholder" });
  }

  // Apply link (15 pts)
  if (applyLink && applyLink.startsWith("http")) {
    score += 15;
    issues.push({ check: "apply_link", status: "pass", message: "Application link present" });
  } else {
    issues.push({ check: "apply_link", status: "fail", message: "No valid application link", recommendation: "Add the official application URL" });
  }

  // Deadline (10 pts)
  if (deadline) {
    score += 10;
    issues.push({ check: "deadline", status: "pass", message: `Deadline: ${deadline}` });
  } else {
    issues.push({ check: "deadline", status: "warn", message: "No deadline found", recommendation: "Check the source page for the deadline" });
  }

  // Country (5 pts)
  if (country) {
    score += 5;
    issues.push({ check: "location", status: "pass", message: `Country: ${country}` });
  } else {
    issues.push({ check: "location", status: "warn", message: "No country specified", recommendation: "Add the host country" });
  }

  // Category (5 pts)
  if (category) {
    score += 5;
    issues.push({ check: "category", status: "pass", message: `Category: ${category}` });
  } else {
    issues.push({ check: "category", status: "warn", message: "No category assigned", recommendation: "Select a category" });
  }

  // Gallery images (5 pts)
  if (images && images.length > 0) {
    score += 5;
    issues.push({ check: "gallery", status: "pass", message: `${images.length} image(s) available` });
  } else {
    issues.push({ check: "gallery", status: "warn", message: "No gallery images", recommendation: "Images improve engagement" });
  }

  return { score, issues };
}

function makeAuditEvent(
  eventType: AuditEvent["eventType"],
  description: string,
  actorId?: string,
  extra?: Partial<AuditEvent>,
): AuditEvent {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    eventType,
    actorId,
    description,
    ...extra,
  };
}

// ── Routes ───────────────────────────────────────────────

// GET /api/scraper/status
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

// GET /api/scraper/queue-counts — count per status for editorial tabs
router.get("/scraper/queue-counts", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const rows = await db
      .select({ status: scrapedItemsTable.status, count: sql<number>`count(*)` })
      .from(scrapedItemsTable)
      .groupBy(scrapedItemsTable.status);

    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.status] = Number(r.count);

    // Merge legacy "pending" into "needs_review" for display
    const needsReview = (counts["needs_review"] ?? 0) + (counts["pending"] ?? 0);
    const approved = (counts["approved"] ?? 0) + (counts["published"] ?? 0);

    res.json({
      all: rows.reduce((s: number, r: { count: number | string }) => s + Number(r.count), 0),
      needs_review: needsReview,
      needs_images: counts["needs_images"] ?? 0,
      needs_metadata: counts["needs_metadata"] ?? 0,
      needs_verification: counts["needs_verification"] ?? 0,
      scheduled: counts["scheduled"] ?? 0,
      published: approved,
      archived: counts["archived"] ?? 0,
      rejected: counts["rejected"] ?? 0,
      enriching: counts["enriching"] ?? 0,
      enriched: counts["enriched"] ?? 0,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// POST /api/scraper/run
router.post("/scraper/run", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const startedAt = new Date().toISOString();

  // Hard cap: respond within 120 s no matter what
  const WALL_CLOCK_MS = 120_000;
  const deadline = Date.now() + WALL_CLOCK_MS;

  try {
    const { results, summary } = await runAllScrapers();

    // ── 1. Validate ────────────────────────────────────────────────────────
    // Items without a usable sourceUrl or title can never be inserted (and
    // previously all collapsed onto one dedupe key, so they were miscounted as
    // "duplicates"). Reject them explicitly and report why.
    const invalidItems: { source: string; title: string; reason: string }[] = [];
    const validResults: ScrapedResult[] = [];
    for (const item of results) {
      const url = typeof item.sourceUrl === "string" ? item.sourceUrl.trim() : "";
      const title = typeof item.title === "string" ? item.title.trim() : "";
      if (!/^https?:\/\//i.test(url)) {
        invalidItems.push({
          source: item.source ?? "unknown",
          title: title || "(no title)",
          reason: `missing or invalid sourceUrl: ${JSON.stringify(item.sourceUrl ?? null)}`,
        });
        continue;
      }
      if (!title) {
        invalidItems.push({ source: item.source ?? "unknown", title: "(no title)", reason: "missing title" });
        continue;
      }
      validResults.push({ ...item, sourceUrl: url, title });
    }

    // ── 2. In-run deduplication by sourceUrl ───────────────────────────────
    const seenUrls = new Set<string>();
    const uniqueResults: ScrapedResult[] = [];
    for (const item of validResults) {
      const key = item.sourceUrl;
      if (seenUrls.has(key)) continue;
      seenUrls.add(key);
      uniqueResults.push(item);
    }
    const withinRunDeduped = validResults.length - uniqueResults.length;

    // ── 3. Batch DB dedup — chunked queries, errors surfaced ───────────────
    const allUrls = uniqueResults.map((i) => i.sourceUrl);
    const { known: existingUrls, error: dedupeError } = await getExistingUrls(allUrls);
    if (dedupeError) req.log.error({ dedupeError }, "scraper: dedupe query failed");
    const toEnrich = uniqueResults.filter((i) => !existingUrls.has(i.sourceUrl));
    const dbDuplicates = uniqueResults.length - toEnrich.length;

    // Cap enrichment: only fetch detail pages for the first 40 new items,
    // and skip if we're already past the wall-clock deadline
    const timeLeft = deadline - Date.now();
    const enrichCap = Math.min(toEnrich.length, 40);
    const toEnrichCapped = toEnrich.slice(0, enrichCap);

    const limit = pLimit(6);
    const enriched = timeLeft > 5_000
      ? await enrichResults(toEnrichCapped, limit)
      : toEnrichCapped; // skip enrichment if running out of time

    let added = 0;
    let insertFailed = 0;
    const insertErrors: { title: string; sourceUrl: string; error: string }[] = [];
    const duplicates = withinRunDeduped + dbDuplicates;

    for (const item of enriched) {
      try {
        const { score, issues } = computeQualityScore(item as unknown as Record<string, unknown>);
        const auditEvents: AuditEvent[] = [
          makeAuditEvent("discovered", `Discovered by scraper: ${item.source}`, adminId),
          makeAuditEvent("enriched", `Enriched via ${item.extractionMethod ?? "html"}`, adminId),
        ];

        // Safety strip: run htmlToPlainText over content/plainText before
        // storing so any HTML that slipped through extraction is removed.
        const safeText = item.plainText ? htmlToPlainText(item.plainText) : null;
        const safeContent = item.content
          ? htmlToPlainText(item.content)
          : safeText;
        const safeDesc = safeText
          ? createPreview(safeText)
          : item.description
          ? htmlToPlainText(item.description)
          : null;

        await db.insert(scrapedItemsTable).values({
          source: item.source,
          sourceUrl: item.sourceUrl,
          title: item.title,
          itemType: item.itemType,
          status: "needs_review",
          description: safeDesc,
          content: safeContent ?? null,
          plainText: safeText ?? null,
          coverImage: item.coverImage ?? (item.images?.[0] ?? null),
          images: item.images ?? null,
          deadline: item.deadline ?? null,
          country: item.country ?? null,
          category: item.category ?? null,
          applyLink: item.applyLink ?? null,
          scraperName: item.source,
          qualityScore: score,
          qualityIssues: issues as any,
          auditEvents: auditEvents as any,
          rawData: { ...(item.rawData ?? {}), images: item.images },
          extractionMethod: item.extractionMethod ?? null,
        });
        added++;
      } catch (err) {
        insertFailed++;
        const message = err instanceof Error ? err.message : String(err);
        req.log.error(
          { err, sourceUrl: item.sourceUrl, title: item.title },
          "scraper: insert into scraped_items failed",
        );
        if (insertErrors.length < 10) {
          insertErrors.push({ title: item.title ?? "(no title)", sourceUrl: item.sourceUrl, error: message });
        }
      }
    }

    res.json({
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: summary.durationMs,
      total: results.length,
      added,
      duplicates,
      failed: insertFailed + summary.errors.length,
      // Full breakdown so a run that adds nothing explains itself
      diagnostics: {
        scraped: results.length,
        invalid: invalidItems.length,
        invalidSamples: invalidItems.slice(0, 10),
        withinRunDuplicates: withinRunDeduped,
        dbDuplicates,
        dedupeError: dedupeError ?? null,
        candidates: toEnrich.length,
        enrichmentSkipped: !(timeLeft > 5_000),
        enrichCapped: toEnrich.length > enrichCap,
        attemptedInserts: enriched.length,
        inserted: added,
        insertFailed,
        insertErrors,
      },
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

// GET /api/scraper/items
router.get("/scraper/items", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const { status } = req.query as { status?: string };

    let items;
    if (status === "needs_review") {
      // Treat "pending" (legacy) as needs_review
      items = await db
        .select()
        .from(scrapedItemsTable)
        .where(inArray(scrapedItemsTable.status, ["pending", "needs_review"]))
        .orderBy(desc(scrapedItemsTable.scrapedAt));
    } else if (status === "published") {
      items = await db
        .select()
        .from(scrapedItemsTable)
        .where(inArray(scrapedItemsTable.status, ["approved", "published"]))
        .orderBy(desc(scrapedItemsTable.scrapedAt));
    } else if (status) {
      items = await db
        .select()
        .from(scrapedItemsTable)
        .where(eq(scrapedItemsTable.status, status))
        .orderBy(desc(scrapedItemsTable.scrapedAt));
    } else {
      items = await db
        .select()
        .from(scrapedItemsTable)
        .orderBy(desc(scrapedItemsTable.scrapedAt));
    }

    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// DELETE /api/scraper/items — clear all scraped data (admin only)
router.delete("/scraper/items", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    await db.delete(scrapedItemsTable);
    res.json({ ok: true, message: "All scraped items deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// DELETE /api/scraper/items/:id — delete a single scraped item
router.delete("/scraper/items/:id", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    await db.delete(scrapedItemsTable).where(eq(scrapedItemsTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// GET /api/scraper/items/:id
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

// PATCH /api/scraper/items/:id — partial field update (editorial edits)
router.patch("/scraper/items/:id", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const [item] = await db
      .select()
      .from(scrapedItemsTable)
      .where(eq(scrapedItemsTable.id, req.params.id))
      .limit(1);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }

    const body = req.body as Record<string, unknown>;

    // Pick only editable fields from body
    const allowed = [
      "title", "description", "content", "plainText", "deadline", "country",
      "category", "applyLink", "coverImage", "images", "sections",
      "organizationProfile", "fundingDetails", "tags", "opportunityType",
      "academicLevel", "eligibleNationalities", "language", "duration",
      "salary", "internalNotes", "assignedTo", "verificationStatus",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // Recompute quality score with updated data
    const merged = { ...item, ...updates };
    const { score, issues } = computeQualityScore(merged as Record<string, unknown>);
    updates.qualityScore = score;
    updates.qualityIssues = issues;
    updates.updatedAt = new Date();

    // Append audit event
    const existingEvents = (item.auditEvents as AuditEvent[] | null) ?? [];
    const editedFields = Object.keys(updates).filter(
      k => k !== "qualityScore" && k !== "qualityIssues" && k !== "updatedAt" && k !== "auditEvents"
    );
    existingEvents.push(
      makeAuditEvent(
        "field_edited",
        `Edited: ${editedFields.join(", ")}`,
        adminId,
      )
    );
    updates.auditEvents = existingEvents;

    await db
      .update(scrapedItemsTable)
      .set(updates as any)
      .where(eq(scrapedItemsTable.id, req.params.id));

    const [updated] = await db
      .select()
      .from(scrapedItemsTable)
      .where(eq(scrapedItemsTable.id, req.params.id))
      .limit(1);

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error", detail: err instanceof Error ? err.message : String(err) });
  }
});

// PUT /api/scraper/items/:id/status — status transition
router.put("/scraper/items/:id/status", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const [item] = await db
      .select()
      .from(scrapedItemsTable)
      .where(eq(scrapedItemsTable.id, req.params.id))
      .limit(1);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }

    const { status, reason, scheduledAt } = req.body as {
      status: string;
      reason?: string;
      scheduledAt?: string;
    };

    const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (reason) updates.rejectionReason = reason;
    if (scheduledAt) updates.scheduledAt = new Date(scheduledAt);
    if (status === "published" || status === "approved") updates.publishedAt = new Date();
    if (status === "archived") updates.archivedAt = new Date();

    const existingEvents = (item.auditEvents as AuditEvent[] | null) ?? [];
    existingEvents.push(
      makeAuditEvent(
        "status_changed",
        `Status: ${item.status} → ${status}${reason ? ` (${reason})` : ""}`,
        adminId,
        { fromStatus: item.status, toStatus: status }
      )
    );
    updates.auditEvents = existingEvents;

    await db
      .update(scrapedItemsTable)
      .set(updates as any)
      .where(eq(scrapedItemsTable.id, req.params.id));

    res.json({ ok: true, status });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// PUT /api/scraper/items/:id/approve — approve and publish (legacy + new)
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

    const notReviewable = ["approved", "published", "archived"];
    if (notReviewable.includes(item.status)) {
      res.status(400).json({ error: "Already published" }); return;
    }

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

        const existingEvents = (item.auditEvents as AuditEvent[] | null) ?? [];
        existingEvents.push(
          makeAuditEvent("published", `Published as opportunity: ${slug}`, adminId)
        );

        await tx
          .update(scrapedItemsTable)
          .set({
            status: "published",
            opportunityId: opp.id,
            reviewedAt: new Date(),
            reviewedBy: adminId,
            publishedAt: new Date(),
            auditEvents: existingEvents,
            updatedAt: new Date(),
          })
          .where(eq(scrapedItemsTable.id, item.id));

        res.json({ created: "opportunity", id: opp.id, slug: opp.slug });
      } else {
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

        const existingEvents = (item.auditEvents as AuditEvent[] | null) ?? [];
        existingEvents.push(
          makeAuditEvent("published", `Published as job: ${job.id}`, adminId)
        );

        await tx
          .update(scrapedItemsTable)
          .set({
            status: "published",
            jobId: job.id,
            reviewedAt: new Date(),
            reviewedBy: adminId,
            publishedAt: new Date(),
            auditEvents: existingEvents,
            updatedAt: new Date(),
          })
          .where(eq(scrapedItemsTable.id, item.id));

        res.json({ created: "job", id: job.id });
      }
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error", detail: err instanceof Error ? err.message : String(err) });
  }
});

// PUT /api/scraper/items/:id/reject
router.put("/scraper/items/:id/reject", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const [item] = await db
      .select()
      .from(scrapedItemsTable)
      .where(eq(scrapedItemsTable.id, req.params.id))
      .limit(1);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }

    const { reason } = req.body as { reason?: string };

    const existingEvents = (item.auditEvents as AuditEvent[] | null) ?? [];
    existingEvents.push(
      makeAuditEvent("rejected", `Rejected${reason ? `: ${reason}` : ""}`, adminId)
    );

    await db
      .update(scrapedItemsTable)
      .set({
        status: "rejected",
        rejectionReason: reason ?? null,
        reviewedAt: new Date(),
        reviewedBy: adminId,
        auditEvents: existingEvents,
        updatedAt: new Date(),
      })
      .where(eq(scrapedItemsTable.id, req.params.id));

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// POST /api/scraper/items/bulk — bulk status operations
router.post("/scraper/items/bulk", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const { ids, action, reason } = req.body as {
      ids: string[];
      action: "approve" | "reject" | "archive" | "delete" | "needs_review" | "needs_images" | "needs_metadata";
      reason?: string;
    };

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "ids must be a non-empty array" }); return;
    }

    // Delete is a special case — no status update, just remove rows
    if (action === "delete") {
      await db.delete(scrapedItemsTable).where(inArray(scrapedItemsTable.id, ids));
      res.json({ ok: true, deleted: ids.length });
      return;
    }

    let newStatus: string;
    switch (action) {
      case "approve":    newStatus = "published"; break;
      case "reject":     newStatus = "rejected"; break;
      case "archive":    newStatus = "archived"; break;
      default:           newStatus = action;
    }

    const updates: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date(),
    };
    if (action === "reject" && reason) updates.rejectionReason = reason;
    if (newStatus === "published") updates.publishedAt = new Date();
    if (newStatus === "archived") updates.archivedAt = new Date();

    await db
      .update(scrapedItemsTable)
      .set(updates as any)
      .where(inArray(scrapedItemsTable.id, ids));

    res.json({ ok: true, updated: ids.length, status: newStatus });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// GET /api/scraper/stats
router.get("/scraper/stats", (_req, res) => {
  (async () => {
    try {
      const rows = await db
        .select({ status: scrapedItemsTable.status, count: sql<number>`count(*)` })
        .from(scrapedItemsTable)
        .groupBy(scrapedItemsTable.status);

      const counts: Record<string, number> = {};
      for (const r of rows) counts[r.status] = Number(r.count);

      const [published] = await db
        .select({ count: sql<number>`count(*)` })
        .from(opportunitiesTable)
        .where(eq(opportunitiesTable.status, "published"));

      res.json({
        scrapedItems: {
          pending: (counts["pending"] ?? 0) + (counts["needs_review"] ?? 0),
          needsImages: counts["needs_images"] ?? 0,
          needsMetadata: counts["needs_metadata"] ?? 0,
          needsVerification: counts["needs_verification"] ?? 0,
          scheduled: counts["scheduled"] ?? 0,
          approved: (counts["approved"] ?? 0) + (counts["published"] ?? 0),
          rejected: counts["rejected"] ?? 0,
          archived: counts["archived"] ?? 0,
          total: rows.reduce((s: number, r: { count: number | string }) => s + Number(r.count), 0),
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
