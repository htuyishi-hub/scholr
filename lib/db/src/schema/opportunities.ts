import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  date,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const opportunitiesTable = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  content: text("content"),
  coverImage: text("cover_image"),
  galleryImages: text("gallery_images").array().default([]),
  category: text("category"),
  country: text("country"),
  fundingType: text("funding_type"),
  studyLevel: text("study_level").array(),
  deadline: date("deadline"),
  amount: text("amount"),
  applyLink: text("apply_link"),
  whatsappNumber: text("whatsapp_number"),
  tags: text("tags").array(),
  status: text("status", { enum: ["draft", "published", "archived"] })
    .notNull()
    .default("draft"),
  featured: boolean("featured").notNull().default(false),
  pinned: boolean("pinned").notNull().default(false),
  views: integer("views").notNull().default(0),
  authorId: uuid("author_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  seoTitle: text("seo_title"),
  metaDescription: text("meta_description"),

  // Eligibility fields (Part 1B)
  minGpa: numeric("min_gpa", { precision: 3, scale: 2 }),
  eligibleCountries: text("eligible_countries").array(),
  ineligibleCountries: text("ineligible_countries").array(),
  requiredField: text("required_field").array(),
  minEnglishIelts: numeric("min_english_ielts", { precision: 3, scale: 1 }),
  ageMin: integer("age_min"),
  ageMax: integer("age_max"),
  genderRestriction: text("gender_restriction"),

  // Enrichment fields (Part 6A)
  hostOrganization: text("host_organization"),
  hostWebsite: text("host_website"),
  scholarshipType: text("scholarship_type"),
  renewable: boolean("renewable"),
  numberOfAwards: integer("number_of_awards"),
  applicationFee: numeric("application_fee", { precision: 10, scale: 2 }),
  interviewRequired: boolean("interview_required"),
  essayRequired: boolean("essay_required"),
  referenceLetters: integer("reference_letters"),
  notificationDate: date("notification_date"),
  programDuration: text("program_duration"),
  requiredDocuments: text("required_documents").array(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOpportunitySchema = createInsertSchema(
  opportunitiesTable
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunitiesTable.$inferSelect;
