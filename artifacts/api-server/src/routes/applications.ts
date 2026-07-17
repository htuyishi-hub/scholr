import { Router } from "express";
import { db, managedApplicationsTable, studentProfilesTable, opportunitiesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getUserIdFromToken } from "../lib/auth.js";
import type { DocumentSlot } from "@workspace/db";

const router = Router();

function getStudentId(req: import("express").Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  return getUserIdFromToken(`student:${token}`) ?? null;
}

function getAdminId(req: import("express").Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  return getUserIdFromToken(token) ?? null;
}

function toISO(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

function mapApp(
  app: Record<string, unknown>,
  student?: Record<string, unknown> | null,
  opp?: Record<string, unknown> | null,
  handler?: Record<string, unknown> | null
) {
  return {
    ...app,
    createdAt: toISO(app.createdAt),
    updatedAt: toISO(app.updatedAt),
    student: student
      ? {
          id: student.id, name: student.name, email: student.email,
          nationality: student.nationality, educationLevel: student.educationLevel,
          gpa: student.gpa, whatsappNumber: student.whatsappNumber,
          ieltsScore: student.ieltsScore,
        }
      : null,
    opportunity: opp
      ? {
          id: opp.id, title: opp.title, slug: opp.slug,
          deadline: opp.deadline ? String(opp.deadline) : null,
          country: opp.country, category: opp.category,
          requiredDocuments: opp.requiredDocuments ?? [],
        }
      : null,
    handler: handler ? { id: handler.id, name: handler.name, email: handler.email } : null,
  };
}

// POST /api/applications — student submits a managed application
router.post("/", async (req, res) => {
  const studentId = getStudentId(req);
  if (!studentId) { res.status(401).json({ error: "Not authenticated as student" }); return; }
  const { opportunityId, motivation, experience, contactPreference, whatsappNumber, contactTime, concerns } =
    req.body as Record<string, string>;
  if (!opportunityId) { res.status(400).json({ error: "opportunityId is required" }); return; }
  try {
    const [existing] = await db
      .select().from(managedApplicationsTable)
      .where(and(eq(managedApplicationsTable.studentId, studentId), eq(managedApplicationsTable.opportunityId, opportunityId)))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "You have already applied to this opportunity", application: mapApp(existing as Record<string, unknown>) });
      return;
    }
    const [app] = await db
      .insert(managedApplicationsTable)
      .values({
        studentId, opportunityId, motivation, experience,
        contactPreference, whatsappNumber, contactTime, concerns,
        timeline: [{ date: new Date().toISOString(), event: "Application received" }],
      })
      .returning();
    res.status(201).json(mapApp(app as Record<string, unknown>));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/applications/:id/documents — student uploads documents
router.put("/:id/documents", async (req, res) => {
  const studentId = getStudentId(req);
  if (!studentId) { res.status(401).json({ error: "Not authenticated as student" }); return; }
  try {
    const [app] = await db.select().from(managedApplicationsTable).where(eq(managedApplicationsTable.id, req.params.id)).limit(1);
    if (!app || app.studentId !== studentId) { res.status(404).json({ error: "Not found" }); return; }

    const { documents } = req.body as { documents: DocumentSlot[] };
    if (!Array.isArray(documents)) { res.status(400).json({ error: "documents must be an array" }); return; }

    // Check if all required docs are uploaded → auto-advance status to documents_collection
    const allRequiredUploaded = documents.filter((d) => d.required).every((d) => !!d.objectPath);
    const updates: Record<string, unknown> = {
      documents,
      updatedAt: new Date(),
    };

    // Auto-advance status if still pending_review or profile_check
    if (allRequiredUploaded && (app.status === "pending_review" || app.status === "profile_check")) {
      updates.status = "documents_collection";
      const timeline = (app.timeline as { date: string; event: string }[]) || [];
      timeline.push({ date: new Date().toISOString(), event: "Documents uploaded by student" });
      updates.timeline = timeline;
    }

    const [updated] = await db
      .update(managedApplicationsTable)
      .set(updates)
      .where(eq(managedApplicationsTable.id, req.params.id))
      .returning();
    res.json(mapApp(updated as Record<string, unknown>));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/applications — student gets their applications
router.get("/", async (req, res) => {
  const studentId = getStudentId(req);
  if (!studentId) { res.status(401).json({ error: "Not authenticated as student" }); return; }
  try {
    const apps = await db.select().from(managedApplicationsTable)
      .where(eq(managedApplicationsTable.studentId, studentId))
      .orderBy(desc(managedApplicationsTable.createdAt));
const enriched = await Promise.all(
      apps.map(async (app: Record<string, unknown>) => {
        const [opp] = await db
          .select()
          .from(opportunitiesTable)
          .where(eq(opportunitiesTable.id, app.opportunityId as string))
          .limit(1);
        return mapApp(app, null, opp as Record<string, unknown> | null);
      }),
    );
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/applications/:id — student gets a specific application
router.get("/:id", async (req, res) => {
  const studentId = getStudentId(req);
  if (!studentId) { res.status(401).json({ error: "Not authenticated as student" }); return; }
  try {
    const [app] = await db.select().from(managedApplicationsTable).where(eq(managedApplicationsTable.id, req.params.id)).limit(1);
    if (!app || app.studentId !== studentId) { res.status(404).json({ error: "Not found" }); return; }
    const [opp] = await db.select().from(opportunitiesTable).where(eq(opportunitiesTable.id, app.opportunityId)).limit(1);
    res.json(mapApp(app as Record<string, unknown>, null, opp as Record<string, unknown> | null));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/applications/admin/all — admin gets all applications
router.get("/admin/all", async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated as admin" }); return; }
  try {
    const { status } = req.query as { status?: string };

    const allowedStatuses = new Set([
      "pending_review",
      "profile_check",
      "documents_collection",
      "in_progress",
      "submitted",
      "accepted",
      "rejected",
    ] as const);

    const apps = await (
      status && allowedStatuses.has(status as any)
        ? db
            .select()
            .from(managedApplicationsTable)
            .where(
              eq(
                managedApplicationsTable.status,
                status as (typeof allowedStatuses extends Set<infer U> ? U : never),
              ),
            )
            .orderBy(desc(managedApplicationsTable.createdAt))
        : db
            .select()
            .from(managedApplicationsTable)
            .orderBy(desc(managedApplicationsTable.createdAt))
    );

const enriched = await Promise.all(
      apps.map(async (app: Record<string, unknown>) => {
        const [student] = await db
          .select()
          .from(studentProfilesTable)
          .where(eq(studentProfilesTable.id, app.studentId as string))
          .limit(1);

        const [opp] = await db
          .select()
          .from(opportunitiesTable)
          .where(eq(opportunitiesTable.id, app.opportunityId as string))
          .limit(1);

        const handler = app.assignedTo
          ? (
              await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.id, app.assignedTo as string))
                .limit(1)
            )[0]
          : null;

        return mapApp(
          app,
          student as Record<string, unknown> | null,
          opp as Record<string, unknown> | null,
          handler as Record<string, unknown> | null,
        );
      }),
    );
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/applications/admin/:id — admin gets a specific application detail
router.get("/admin/:id", async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated as admin" }); return; }
  try {
    const [app] = await db.select().from(managedApplicationsTable).where(eq(managedApplicationsTable.id, req.params.id)).limit(1);
    if (!app) { res.status(404).json({ error: "Not found" }); return; }
    const [student] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.id, app.studentId)).limit(1);
    const [opp] = await db.select().from(opportunitiesTable).where(eq(opportunitiesTable.id, app.opportunityId)).limit(1);
    const handler = app.assignedTo
      ? (await db.select().from(usersTable).where(eq(usersTable.id, app.assignedTo)).limit(1))[0]
      : null;
    res.json(mapApp(app as Record<string, unknown>, student as Record<string, unknown> | null, opp as Record<string, unknown> | null, handler as Record<string, unknown> | null));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/applications/admin/:id — admin updates an application
router.put("/admin/:id", async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId) { res.status(401).json({ error: "Not authenticated as admin" }); return; }
  try {
    const [existing] = await db.select().from(managedApplicationsTable).where(eq(managedApplicationsTable.id, req.params.id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const { status, assignedTo, notes } = req.body as { status?: string; assignedTo?: string; notes?: string };
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo || null;
    if (notes !== undefined) updates.notes = notes;
    if (status && status !== existing.status) {
      const timeline = (existing.timeline as { date: string; event: string }[]) || [];
      const statusLabels: Record<string, string> = {
        pending_review: "Application received",
        profile_check: "Profile check started",
        documents_collection: "Documents being collected",
        in_progress: "Application in progress",
        submitted: "Submitted to institution",
        accepted: "Application accepted",
        rejected: "Application not successful",
      };
      timeline.push({ date: new Date().toISOString(), event: statusLabels[status] || status });
      updates.timeline = timeline;
    }
    const [updated] = await db.update(managedApplicationsTable).set(updates).where(eq(managedApplicationsTable.id, req.params.id)).returning();
    res.json(mapApp(updated as Record<string, unknown>));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
