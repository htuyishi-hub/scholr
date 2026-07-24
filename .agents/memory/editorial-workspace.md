---
name: Editorial workspace architecture
description: CMS-style editorial pipeline built on top of scraped_items table. Key files, routes, and conventions.
---

## Pipeline states
`pending`/`needs_review` → `needs_images` | `needs_metadata` | `needs_verification` | `scheduled` → `published`/`approved` | `archived` | `expired` | `rejected`

Legacy `pending` and `approved` are treated as aliases for `needs_review` and `published` in the UI.

## New API routes (artifacts/api-server/src/routes/scraper.ts)
- `GET /api/scraper/queue-counts` — per-status counts (merges legacy aliases)
- `PATCH /api/scraper/items/:id` — partial update; recomputes quality score; appends audit event
- `PUT /api/scraper/items/:id/status` — status transition with audit log
- `POST /api/scraper/items/bulk` — bulk status changes (ids[], action)
- Existing approve/reject/run routes preserved for backward compat

## Quality score (artifacts/scholr/src/lib/quality-score.ts)
0–100 computed from: title (15), description (10), content length (20), cover image (15), apply link (15), deadline (10), country (5), category (5), gallery (5). Also computed server-side in `computeQualityScore()` in scraper.ts.

## DB migration
`scholr_migration_v3.sql` adds ~20 columns to `scraped_items`: quality_score, quality_issues, extraction_trace, sections (jsonb), organization_profile, funding_details, tags, opportunity_type, academic_level, eligible_nationalities, language, duration, salary, assigned_to, internal_notes, rejection_reason, scheduled_at, published_at, archived_at, audit_events, verification_status, updated_at.

## Frontend pages
- `artifacts/scholr/src/pages/admin/editorial-queue.tsx` — queue with pipeline tabs, bulk ops, priority sort
- `artifacts/scholr/src/pages/admin/editorial-item.tsx` — per-item 2-col workspace (editor + sidebar)
- `artifacts/scholr/src/lib/quality-score.ts` — shared quality score utility + STATUS_META colors

Routes: `/admin/editorial` and `/admin/editorial/:id` (added to App.tsx). "Editorial" nav item added to admin-layout.tsx.

**Why:** Replaces the binary approve/reject scraper panel with a professional CMS publishing pipeline per user spec.
