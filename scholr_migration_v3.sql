-- ── Migration v3: Editorial Workspace extensions ─────────────────────────
-- Run against your PostgreSQL database.
-- All columns use IF NOT EXISTS so it is safe to re-run.

ALTER TABLE scraped_items
  ADD COLUMN IF NOT EXISTS quality_score     INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quality_issues    JSONB,
  ADD COLUMN IF NOT EXISTS extraction_trace  JSONB,
  ADD COLUMN IF NOT EXISTS sections          JSONB,
  ADD COLUMN IF NOT EXISTS organization_profile JSONB,
  ADD COLUMN IF NOT EXISTS funding_details   JSONB,
  ADD COLUMN IF NOT EXISTS tags              TEXT[],
  ADD COLUMN IF NOT EXISTS opportunity_type  TEXT,
  ADD COLUMN IF NOT EXISTS academic_level    TEXT[],
  ADD COLUMN IF NOT EXISTS eligible_nationalities TEXT[],
  ADD COLUMN IF NOT EXISTS language          TEXT,
  ADD COLUMN IF NOT EXISTS duration          TEXT,
  ADD COLUMN IF NOT EXISTS salary            TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to       TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes    TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason  TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS audit_events      JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS verification_status JSONB,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Useful index: find items by status quickly
CREATE INDEX IF NOT EXISTS idx_scraped_items_status ON scraped_items(status);
CREATE INDEX IF NOT EXISTS idx_scraped_items_quality ON scraped_items(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_items_updated ON scraped_items(updated_at DESC);
