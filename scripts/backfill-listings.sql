-- ────────────────────────────────────────────────────────────────────────────
-- Phase 1: Data Quality Backfill
--
-- This migration fixes two confirmed data-quality problems in the live
-- opportunities table:
--
-- 1. Placeholder titles — listings with generic titles like "The scholarship",
--    "Announcement", "Opportunity" that should contain the actual program name.
--    These are set to "draft" status so they can be reviewed and given proper
--    titles before being republished. This prevents them from appearing live
--    with non-descriptive titles that hurt SEO and user trust.
--
-- 2. Incorrect "Rwanda" country tags — listings tagged "Rwanda" whose
--    title, description, or content never mention Rwanda. These are global
--    scholarships (e.g. Rhodes, Gates Cambridge) that were incorrectly
--    defaulted to "Rwanda". They are retagged to "Global" instead.
--
-- Both operations are safe to re-run: the WHERE clauses ensure each UPDATE
-- only affects rows that still match the problem condition.
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Unpublish listings with placeholder titles so they can be reviewed
--    and given proper names before going live again.
UPDATE opportunities
SET status = 'draft',
    updated_at = now()
WHERE status = 'published'
  AND lower(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9 ]', '', 'g'),
      '\s+', ' ', 'g'
    )
  ) IN (
    'the scholarship',
    'announcement',
    'announcements',
    'opportunity',
    'opportunities',
    'scholarship',
    'scholarships',
    'untitled',
    'new post',
    'news',
    'the program',
    'programme',
    'apply now',
    'test'
  );

-- 2. Fix incorrect "Rwanda" country tags on listings that never mention
--    Rwanda in their text. These are global scholarships that were
--    silently defaulted to "Rwanda" during ingestion.
UPDATE opportunities
SET country = 'Global',
    updated_at = now()
WHERE status = 'published'
  AND country = 'Rwanda'
  AND title !~* 'rwanda'
  AND COALESCE(description, '') !~* 'rwanda'
  AND COALESCE(content, '') !~* 'rwanda'
  AND COALESCE(host_organization, '') !~* 'rwanda';
