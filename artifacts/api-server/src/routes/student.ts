import { Router } from "express";
import { db, studentProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken, storeToken, getUserIdFromToken, removeToken } from "../lib/auth.js";

const router = Router();

function toISO(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

function safeStudent(s: typeof studentProfilesTable.$inferSelect) {
  const { passwordHash: _, ...rest } = s;
  return {
    ...rest,
    createdAt: toISO(rest.createdAt),
    updatedAt: toISO(rest.updatedAt),
  };
}

// POST /api/student/register
router.post("/register", async (req, res) => {
  const { email, name, password } = req.body as { email: string; name: string; password: string };
  if (!email || !name || !password) {
    res.status(400).json({ error: "Email, name, and password required" });
    return;
  }
  try {
    const [existing] = await db
      .select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.email, email.toLowerCase().trim()))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = hashPassword(password);
    const [student] = await db
      .insert(studentProfilesTable)
      .values({ email: email.toLowerCase().trim(), name, passwordHash })
      .returning();
    const token = generateToken();
    storeToken(`student:${token}`, student.id);
    res.status(201).json({ student: safeStudent(student), token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/student/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  try {
    const [student] = await db
      .select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.email, email.toLowerCase().trim()))
      .limit(1);
    if (!student || !verifyPassword(password, student.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = generateToken();
    storeToken(`student:${token}`, student.id);
    res.json({ student: safeStudent(student), token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/student/logout
router.post("/logout", (req, res) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    removeToken(`student:${auth.slice(7)}`);
  }
  res.json({ message: "Logged out" });
});

// GET /api/student/me
router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const token = auth.slice(7);
  const studentId = getUserIdFromToken(`student:${token}`);
  if (!studentId) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  try {
    const [student] = await db
      .select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.id, studentId))
      .limit(1);
    if (!student) {
      res.status(401).json({ error: "Student not found" });
      return;
    }
    res.json(safeStudent(student));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/student/profile
router.put("/profile", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const token = auth.slice(7);
  const studentId = getUserIdFromToken(`student:${token}`);
  if (!studentId) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  try {
    const allowed = [
      "name", "nationality", "residence", "dateOfBirth", "educationLevel", "gpa",
      "fieldOfStudy", "graduationYear", "englishLevel", "ieltsScore", "toeflScore",
      "targetLevel", "targetCountry", "targetField", "studyTimeline",
      "passportCountry", "hasVisa", "whatsappNumber",
    ] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    // Auto-compute profile completeness
    const allFields = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.id, studentId)).limit(1);
    const merged = { ...allFields[0], ...updates };
    const profileComplete = !!(
      merged.nationality && merged.educationLevel && merged.gpa &&
      merged.targetLevel && (merged.targetLevel as string[]).length > 0 &&
      merged.targetCountry && (merged.targetCountry as string[]).length > 0
    );

    const [updated] = await db
      .update(studentProfilesTable)
      .set({ ...updates, profileComplete, updatedAt: new Date() })
      .where(eq(studentProfilesTable.id, studentId))
      .returning();
    res.json(safeStudent(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
