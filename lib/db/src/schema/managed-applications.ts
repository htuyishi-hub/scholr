import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentProfilesTable } from "./student-profiles";
import { opportunitiesTable } from "./opportunities";
import { usersTable } from "./users";

export interface DocumentSlot {
  type: string;
  label: string;
  required: boolean;
  objectPath?: string | null;
  fileName?: string | null;
  uploadedAt?: string | null;
  size?: number | null;
}

export const managedApplicationsTable = pgTable("managed_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfilesTable.id, { onDelete: "cascade" }),
  opportunityId: uuid("opportunity_id")
    .notNull()
    .references(() => opportunitiesTable.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: [
      "pending_review",
      "profile_check",
      "documents_collection",
      "in_progress",
      "submitted",
      "accepted",
      "rejected",
    ],
  })
    .notNull()
    .default("pending_review"),
  motivation: text("motivation"),
  experience: text("experience"),
  contactPreference: text("contact_preference"),
  whatsappNumber: text("whatsapp_number"),
  contactTime: text("contact_time"),
  concerns: text("concerns"),
  assignedTo: uuid("assigned_to").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  documents: jsonb("documents").$type<DocumentSlot[]>().default([]),
  notes: text("notes"),
  timeline: jsonb("timeline").$type<{ date: string; event: string }[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertManagedApplicationSchema = createInsertSchema(
  managedApplicationsTable
).omit({
  id: true,
  status: true,
  assignedTo: true,
  notes: true,
  timeline: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertManagedApplication = z.infer<typeof insertManagedApplicationSchema>;
export type ManagedApplication = typeof managedApplicationsTable.$inferSelect;
