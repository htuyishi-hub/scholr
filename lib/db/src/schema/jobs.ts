import {
  pgTable, text, timestamp, uuid, boolean, date
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  location: text("location"),
  jobType: text("job_type"), // full-time, part-time, contract, internship, remote
  category: text("category"), // Technology, Health, Education, Finance, NGO, Government, etc.
description: text("description"),
  content: text("content"),
  requirements: text("requirements"),
  coverImage: text("cover_image"),
  galleryImages: text("gallery_images").array(),
  applicationLink: text("application_link"),
  contactEmail: text("contact_email"),
  salary: text("salary"),
  deadline: date("deadline"),
  status: text("status", { enum: ["pending", "published", "rejected", "expired"] })
    .notNull().default("pending"),
  sourceType: text("source_type", { enum: ["manual", "scraped", "user_submitted"] })
    .notNull().default("user_submitted"),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  // Submitter info (for user-submitted jobs)
  submitterName: text("submitter_name"),
  submitterEmail: text("submitter_email"),
  submitterOrg: text("submitter_org"),
  // Admin fields
  adminNotes: text("admin_notes"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
