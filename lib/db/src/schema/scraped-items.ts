import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  numeric,
  integer,
} from "drizzle-orm/pg-core";

// ── Status pipeline ────────────────────────────────────────────────────────
export const SCRAPER_STATUSES = [
  "pending",           // legacy alias for needs_review
  "enriching",         // enrichment in progress
  "enriched",          // enriched, awaiting triage
  "needs_metadata",    // missing key metadata fields
  "needs_images",      // no suitable cover image
  "needs_review",      // ready for editorial review
  "needs_verification",// links / info need verification
  "scheduled",         // scheduled for future publication
  "approved",          // legacy alias for published
  "published",         // live on public site
  "archived",          // intentionally archived
  "expired",           // deadline has passed
  "rejected",          // rejected, will not publish
] as const;

export type ScraperStatus = (typeof SCRAPER_STATUSES)[number];

// ── Nested type definitions ────────────────────────────────────────────────
export interface QualityIssue {
  check: string;
  status: "pass" | "warn" | "fail";
  message: string;
  recommendation?: string;
}

export interface ExtractionTrace {
  strategy: string;
  duration: number;
  confidence: number;
  fallbacksAttempted: string[];
  fieldsExtracted: string[];
}

export interface ContentSections {
  overview?: string;
  benefits?: string;
  eligibility?: string;
  requirements?: string;
  documents?: string;
  applicationProcess?: string;
  importantDates?: string;
  fundingDetails?: string;
  location?: string;
  contactInfo?: string;
  faq?: string;
  additionalNotes?: string;
}

export interface OrganizationProfile {
  name?: string;
  type?: string;
  website?: string;
  country?: string;
  description?: string;
  logo?: string;
  trustLevel?: "verified" | "trusted" | "standard" | "review_required";
}

export interface FundingDetails {
  type?: string;
  amount?: string;
  currency?: string;
  covers?: string[];
  renewable?: boolean;
  numberOfAwards?: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType:
    | "discovered"
    | "enriched"
    | "status_changed"
    | "field_edited"
    | "image_changed"
    | "note_added"
    | "published"
    | "rejected"
    | "archived"
    | "scheduled"
    | "verification_updated";
  actorId?: string;
  actorName?: string;
  description: string;
  fromStatus?: string;
  toStatus?: string;
  metadata?: Record<string, unknown>;
}

export interface VerificationStatus {
  applicationLink?: "verified" | "broken" | "unknown";
  deadline?: "verified" | "expired" | "unknown";
  organization?: "verified" | "unverified";
  funding?: "verified" | "unverified";
  lastChecked?: string;
}

// ── Table definition ───────────────────────────────────────────────────────
export const scrapedItemsTable = pgTable("scraped_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  sourceUrl: text("source_url").notNull(),
  title: text("title").notNull(),
  itemType: text("item_type", { enum: ["scholarship", "job"] })
    .notNull()
    .default("scholarship"),

  // Pipeline status (extended via migration v3)
  status: text("status").notNull().default("pending"),

  // Raw scraper data
  rawData: jsonb("raw_data").$type<Record<string, unknown>>(),

  // Core editorial fields
  description: text("description"),
  deadline: text("deadline"),
  country: text("country"),
  category: text("category"),
  applyLink: text("apply_link"),

  // Rich extracted content
  content: text("content"),
  plainText: text("plain_text"),
  coverImage: text("cover_image"),
  images: text("images").array().default([]),

  // Quality & confidence
  confidence: numeric("confidence", { precision: 5, scale: 2 }).default("0"),
  qualityScore: integer("quality_score").default(0),
  qualityIssues: jsonb("quality_issues").$type<QualityIssue[]>(),

  // Scrape metadata
  scraperName: text("scraper_name"),
  httpStatus: integer("http_status"),
  contentHash: text("content_hash"),
  lastModified: timestamp("last_modified", { withTimezone: true }),
  etag: text("etag"),
  extractionVersion: text("extraction_version").default("v1"),
  extractionMethod: text("extraction_method"),
  extractionTrace: jsonb("extraction_trace").$type<ExtractionTrace>(),

  // Structured editorial sections
  sections: jsonb("sections").$type<ContentSections>(),

  // Extended metadata (editorial workspace)
  organizationProfile: jsonb("organization_profile").$type<OrganizationProfile>(),
  fundingDetails: jsonb("funding_details").$type<FundingDetails>(),
  tags: text("tags").array(),
  opportunityType: text("opportunity_type"),
  academicLevel: text("academic_level").array(),
  eligibleNationalities: text("eligible_nationalities").array(),
  language: text("language"),
  duration: text("duration"),
  salary: text("salary"),

  // Editorial workflow
  assignedTo: text("assigned_to"),
  internalNotes: text("internal_notes"),
  rejectionReason: text("rejection_reason"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  auditEvents: jsonb("audit_events").$type<AuditEvent[]>(),
  verificationStatus: jsonb("verification_status").$type<VerificationStatus>(),

  // Linked production records
  opportunityId: uuid("opportunity_id"),
  jobId: uuid("job_id"),

  // Timestamps
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ScrapedItem = typeof scrapedItemsTable.$inferSelect;
