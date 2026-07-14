import {
  pgTable, text, timestamp, uuid, jsonb
} from "drizzle-orm/pg-core";

export const scrapedItemsTable = pgTable("scraped_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(), // e.g. "HEC Rwanda", "University of Rwanda"
  sourceUrl: text("source_url").notNull(),
  title: text("title").notNull(),
  itemType: text("item_type", { enum: ["scholarship", "job"] }).notNull().default("scholarship"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  rawData: jsonb("raw_data").$type<Record<string, unknown>>(),
  // Mapped fields for preview
  description: text("description"),
  deadline: text("deadline"),
  country: text("country"),
  category: text("category"),
  applyLink: text("apply_link"),
  // When approved → which opportunity/job was created
  opportunityId: uuid("opportunity_id"),
  jobId: uuid("job_id"),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
});

export type ScrapedItem = typeof scrapedItemsTable.$inferSelect;
