import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  date,
  numeric,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentProfilesTable = pgTable("student_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  nationality: text("nationality"),
  residence: text("residence"),
  dateOfBirth: date("date_of_birth"),
  educationLevel: text("education_level"),
  gpa: numeric("gpa", { precision: 3, scale: 2 }),
  fieldOfStudy: text("field_of_study"),
  graduationYear: integer("graduation_year"),
  englishLevel: text("english_level"),
  ieltsScore: numeric("ielts_score", { precision: 3, scale: 1 }),
  toeflScore: integer("toefl_score"),
  targetLevel: text("target_level").array(),
  targetCountry: text("target_country").array(),
  targetField: text("target_field"),
  studyTimeline: text("study_timeline"),
  passportCountry: text("passport_country"),
  hasVisa: boolean("has_visa").default(false),
  whatsappNumber: text("whatsapp_number"),
  profileComplete: boolean("profile_complete").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStudentProfileSchema = createInsertSchema(
  studentProfilesTable
).omit({
  id: true,
  passwordHash: true,
  profileComplete: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type StudentProfile = typeof studentProfilesTable.$inferSelect;
