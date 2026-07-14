import { Router } from "express";
import { db, jobsTable } from "@workspace/db";
import { eq, desc, and, or, ilike } from "drizzle-orm";
import { getUserIdFromToken } from "../lib/auth.js";

const router = Router();

function getAdminId(req: import("express").Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return getUserIdFromToken(auth.slice(7)) ?? null;
}

function toISO(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

function mapJob(j: Record<string, unknown>) {
  return { ...j, createdAt: toISO(j.createdAt), updatedAt: toISO(j.updatedAt) };
}

// GET /api/jobs — public listing of published jobs
router.get("/jobs", async (req, res) => {
  try {
    const { q, category, jobType, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, parseInt(limit));
    const offset = (pageNum - 1) * pageSize;

    const conditions = [eq(jobsTable.status, "published")];
    if (category) conditions.push(ilike(jobsTable.category, `%${category}%`));
    if (jobType) conditions.push(ilike(jobsTable.jobType, `%${jobType}%`));
    if (q) conditions.push(
      or(
        ilike(jobsTable.title, `%${q}%`),
        ilike(jobsTable.organization, `%${q}%`),
        ilike(jobsTable.description, `%${q}%`)
      )!
    );

    const jobs = await db.select().from(jobsTable)
      .where(and(...conditions))
      .orderBy(desc(jobsTable.featured), desc(jobsTable.createdAt))
      .limit(pageSize)
      .offset(offset);

    res.json(jobs.map((j) => mapJob(j as Record<string, unknown>)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// GET /api/jobs/:id — single job
router.get("/jobs/:id", async (req, res) => {
  try {
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, req.params.id)).limit(1);
    if (!job || job.status !== "published") { res.status(404).json({ error: "Not found" }); return; }
    res.json(mapJob(job as Record<string, unknown>));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// POST /api/jobs/submit — user submits a job
router.post("/jobs/submit", async (req, res) => {
  try {
    const body = req.body as Record<string, string>;
    const required = ["title", "organization", "description", "submitterName", "submitterEmail"];
    for (const f of required) {
      if (!body[f]) { res.status(400).json({ error: `${f} is required` }); return; }
    }

    const [job] = await db.insert(jobsTable).values({
      title: body.title,
      organization: body.organization,
      location: body.location || "Rwanda",
      jobType: body.jobType || null,
      category: body.category || "Other",
      description: body.description,
      requirements: body.requirements || null,
      applicationLink: body.applicationLink || null,
      contactEmail: body.contactEmail || null,
      salary: body.salary || null,
      deadline: body.deadline || null,
      status: "pending",
      sourceType: "user_submitted",
      submitterName: body.submitterName,
      submitterEmail: body.submitterEmail,
      submitterOrg: body.submitterOrg || body.organization,
    }).returning();

    res.status(201).json(mapJob(job as Record<string, unknown>));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// GET /api/jobs/admin/all — admin gets all jobs
router.get("/jobs/admin/all", async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const { status } = req.query as { status?: "pending" | "published" | "rejected" | "expired" };
    const jobs = status
      ? await db.select().from(jobsTable).where(eq(jobsTable.status, status)).orderBy(desc(jobsTable.createdAt))
      : await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt));
    res.json(jobs.map((j) => mapJob(j as Record<string, unknown>)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// PUT /api/jobs/admin/:id — admin updates a job
router.put("/jobs/admin/:id", async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const body = req.body as Record<string, unknown>;
    const [job] = await db.update(jobsTable).set({
      ...(body.title !== undefined && { title: String(body.title) }),
      ...(body.organization !== undefined && { organization: String(body.organization) }),
      ...(body.location !== undefined && { location: String(body.location) }),
      ...(body.jobType !== undefined && { jobType: String(body.jobType) }),
      ...(body.category !== undefined && { category: String(body.category) }),
      ...(body.description !== undefined && { description: String(body.description) }),
      ...(body.requirements !== undefined && { requirements: String(body.requirements) }),
      ...(body.applicationLink !== undefined && { applicationLink: String(body.applicationLink) }),
      ...(body.salary !== undefined && { salary: String(body.salary) }),
      ...(body.deadline !== undefined && { deadline: String(body.deadline) }),
      ...(body.status !== undefined && { status: body.status as "pending" | "published" | "rejected" | "expired" }),
      ...(body.featured !== undefined && { featured: Boolean(body.featured) }),
      ...(body.adminNotes !== undefined && { adminNotes: String(body.adminNotes) }),
      updatedAt: new Date(),
    }).where(eq(jobsTable.id, req.params.id)).returning();

    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    res.json(mapJob(job as Record<string, unknown>));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

// DELETE /api/jobs/admin/:id — admin deletes a job
router.delete("/jobs/admin/:id", async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    await db.delete(jobsTable).where(eq(jobsTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
