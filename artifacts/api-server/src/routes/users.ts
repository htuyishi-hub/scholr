import { Router } from "express";
import { db, usersTable, opportunitiesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "../lib/auth.js";

const router = Router();

function toISO(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

async function getUserWithPostCount(userId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return null;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.authorId, userId));
  const { passwordHash: _, ...safe } = user;
  return { ...safe, postsCount: count, lastActive: toISO(user.lastActive), createdAt: toISO(user.createdAt) };
}

// GET /api/users
router.get("/", async (req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
    const result = await Promise.all(
      users.map(async (u) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(opportunitiesTable)
          .where(eq(opportunitiesTable.authorId, u.id));
        const { passwordHash: _, ...safe } = u;
        return { ...safe, postsCount: count, lastActive: toISO(u.lastActive), createdAt: toISO(u.createdAt) };
      })
    );
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users
router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role: "admin" | "editor" | "viewer";
  };
  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email, and password are required" });
    return;
  }
  try {
    const [user] = await db
      .insert(usersTable)
      .values({
        name,
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
        role: role || "editor",
      })
      .returning();

    const { passwordHash: _, ...safe } = user;
    res.status(201).json({ ...safe, postsCount: 0, lastActive: null, createdAt: toISO(user.createdAt) });
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "23505") {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  try {
    const user = await getUserWithPostCount(req.params.id);
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/:id
router.put("/:id", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  try {
    await db
      .update(usersTable)
      .set({
        ...(body.name !== undefined && { name: body.name as string }),
        ...(body.role !== undefined && { role: body.role as "admin" | "editor" | "viewer" }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl as string | null }),
      })
      .where(eq(usersTable.id, req.params.id));

    const user = await getUserWithPostCount(req.params.id);
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, req.params.id));
    res.json({ message: "User deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
