import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  numeric,
  integer,
} from "drizzle-orm/pg-core";

export const scrapedItemsTable = pgTable("scraped_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(), // e.g. "HEC Rwanda", "University of Rwanda"
  sourceUrl: text("source_url").notNull(),
  title: text("title").notNull(),
  itemType: text("item_type", { enum: ["scholarship", "job"] }).notNull().default("scholarship"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),

  // Raw data from the scraper's native format
  rawData: jsonb("raw_data").$type<Record<string, unknown>>(),

  // Mapped preview fields
  description: text("description"),
  deadline: text("deadline"),
  country: text("country"),
  category: text("category"),
  applyLink: text("apply_link"),

  // Rich extracted content (Phase 1)
  content: text("content"),               // Sanitized lightweight HTML
  plainText: text("plain_text"),           // Plain text derived from content
  coverImage: text("cover_image"),         // First useful image
  images: text("images").array().default([]), // All extracted images

  // Confidence / scoring for future auto-approval
  confidence: numeric("confidence", { precision: 5, scale: 2 }).default("0"),

  // Scrape metadata (Phase B foundation)
  scraperName: text("scraper_name"),
  httpStatus: integer("http_status"),
  contentHash: text("content_hash"),       // For detecting content changes
  lastModified: timestamp("last_modified", { withTimezone: true }),  // HTTP Last-Modified
  etag: text("etag"),                      // HTTP ETag
  extractionVersion: text("extraction_version").default("v1"),
  extractionMethod: text("extraction_method"),

  // When approved → which opportunity/job was created
  opportunityId: uuid("opportunity_id"),
  jobId: uuid("job_id"),

  // Timestamps
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
});

export type ScrapedItem = typeof scrapedItemsTable.$inferSelect;
