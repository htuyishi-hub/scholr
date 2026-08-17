-- =============================================================
--  Scholr — Full Database Migration
--  Paste this into Supabase → SQL Editor and click Run
--  Safe to run multiple times (uses IF NOT EXISTS / DO blocks)
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- used by gen_random_uuid()

-- =============================================================
-- 1. USERS  (admin / editor / viewer accounts)
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'editor'
                            CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url    TEXT,
  last_active   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 2. STUDENT PROFILES
-- =============================================================
CREATE TABLE IF NOT EXISTS student_profiles (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT        NOT NULL UNIQUE,
  name             TEXT        NOT NULL,
  password_hash    TEXT        NOT NULL,
  nationality      TEXT,
  residence        TEXT,
  date_of_birth    DATE,
  education_level  TEXT,
  gpa              NUMERIC(3,2),
  field_of_study   TEXT,
  graduation_year  INTEGER,
  english_level    TEXT,
  ielts_score      NUMERIC(3,1),
  toefl_score      INTEGER,
  target_level     TEXT[],
  target_country   TEXT[],
  target_field     TEXT,
  study_timeline   TEXT,
  passport_country TEXT,
  has_visa         BOOLEAN     DEFAULT FALSE,
  avatar_url       TEXT,
  whatsapp_number  TEXT,
  profile_complete BOOLEAN     DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 3. OPPORTUNITIES  (scholarships, fellowships, grants, etc.)
-- =============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT        NOT NULL,
  slug                 TEXT        NOT NULL UNIQUE,
  description          TEXT,
  content              TEXT,
  cover_image          TEXT,
  category             TEXT,
  country              TEXT,
  funding_type         TEXT,
  study_level          TEXT[],
  deadline             DATE,
  amount               TEXT,
  apply_link           TEXT,
  whatsapp_number      TEXT,
  tags                 TEXT[],
  status               TEXT        NOT NULL DEFAULT 'draft'
                                   CHECK (status IN ('draft', 'published', 'archived')),
  featured             BOOLEAN     NOT NULL DEFAULT FALSE,
  pinned               BOOLEAN     NOT NULL DEFAULT FALSE,
  views                INTEGER     NOT NULL DEFAULT 0,
  author_id            UUID        REFERENCES users(id) ON DELETE SET NULL,
  seo_title            TEXT,
  meta_description     TEXT,

  -- Eligibility
  min_gpa              NUMERIC(3,2),
  eligible_countries   TEXT[],
  ineligible_countries TEXT[],
  required_field       TEXT[],
  min_english_ielts    NUMERIC(3,1),
  age_min              INTEGER,
  age_max              INTEGER,
  gender_restriction   TEXT,

  -- Enrichment
  host_organization    TEXT,
  host_website         TEXT,
  scholarship_type     TEXT,
  renewable            BOOLEAN,
  number_of_awards     INTEGER,
  application_fee      NUMERIC(10,2),
  interview_required   BOOLEAN,
  essay_required       BOOLEAN,
  reference_letters    INTEGER,
  notification_date    DATE,
  program_duration     TEXT,
  required_documents   TEXT[],

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 4. MANAGED APPLICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS managed_applications (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID        NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  opportunity_id     UUID        NOT NULL REFERENCES opportunities(id)    ON DELETE CASCADE,
  status             TEXT        NOT NULL DEFAULT 'pending_review'
                                 CHECK (status IN (
                                   'pending_review', 'profile_check',
                                   'documents_collection', 'in_progress',
                                   'submitted', 'accepted', 'rejected'
                                 )),
  motivation         TEXT,
  experience         TEXT,
  contact_preference TEXT,
  whatsapp_number    TEXT,
  contact_time       TEXT,
  concerns           TEXT,
  assigned_to        UUID        REFERENCES users(id) ON DELETE SET NULL,
  documents          JSONB       DEFAULT '[]'::JSONB,
  notes              TEXT,
  timeline           JSONB       DEFAULT '[]'::JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 5. ACTIVITY LOG
-- =============================================================
CREATE TABLE IF NOT EXISTS activity (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action            TEXT        NOT NULL,
  opportunity_id    UUID        REFERENCES opportunities(id) ON DELETE CASCADE,
  opportunity_title TEXT        NOT NULL,
  author_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  author_name       TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 6. SETTINGS  (key-value store)
-- =============================================================
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 7. JOBS
-- =============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT        NOT NULL,
  organization     TEXT        NOT NULL,
  location         TEXT,
  job_type         TEXT,
  category         TEXT,
  description      TEXT,
  requirements     TEXT,
  application_link TEXT,
  contact_email    TEXT,
  salary           TEXT,
  deadline         DATE,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'published', 'rejected', 'expired')),
  source_type      TEXT        NOT NULL DEFAULT 'user_submitted'
                               CHECK (source_type IN ('manual', 'scraped', 'user_submitted')),
  source_url       TEXT,
  source_name      TEXT,
  submitter_name   TEXT,
  submitter_email  TEXT,
  submitter_org    TEXT,
  admin_notes      TEXT,
  featured         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 8. SCRAPED ITEMS
-- =============================================================
CREATE TABLE IF NOT EXISTS scraped_items (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source         TEXT        NOT NULL,
  source_url     TEXT        NOT NULL,
  title          TEXT        NOT NULL,
  item_type      TEXT        NOT NULL DEFAULT 'scholarship'
                             CHECK (item_type IN ('scholarship', 'job')),
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected')),
  raw_data       JSONB,
  description    TEXT,
  deadline       TEXT,
  country        TEXT,
  category       TEXT,
  apply_link     TEXT,
  opportunity_id UUID,
  job_id         UUID,
  scraped_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at    TIMESTAMPTZ,
  reviewed_by    TEXT
);

-- =============================================================
-- INDEXES  (improve query performance)
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_opportunities_status   ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_category ON opportunities(category);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_featured ON opportunities(featured);
CREATE INDEX IF NOT EXISTS idx_opportunities_slug     ON opportunities(slug);

CREATE INDEX IF NOT EXISTS idx_managed_apps_student   ON managed_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_managed_apps_opp       ON managed_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_managed_apps_status    ON managed_applications(status);

CREATE INDEX IF NOT EXISTS idx_jobs_status            ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category          ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_featured          ON jobs(featured);

CREATE INDEX IF NOT EXISTS idx_scraped_status         ON scraped_items(status);
CREATE INDEX IF NOT EXISTS idx_scraped_item_type      ON scraped_items(item_type);

CREATE INDEX IF NOT EXISTS idx_activity_created       ON activity(created_at DESC);

-- =============================================================
-- auto-update updated_at via trigger function
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_student_profiles_updated_at') THEN
    CREATE TRIGGER trg_student_profiles_updated_at
      BEFORE UPDATE ON student_profiles
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_opportunities_updated_at') THEN
    CREATE TRIGGER trg_opportunities_updated_at
      BEFORE UPDATE ON opportunities
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_managed_applications_updated_at') THEN
    CREATE TRIGGER trg_managed_applications_updated_at
      BEFORE UPDATE ON managed_applications
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jobs_updated_at') THEN
    CREATE TRIGGER trg_jobs_updated_at
      BEFORE UPDATE ON jobs
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_settings_updated_at') THEN
    CREATE TRIGGER trg_settings_updated_at
      BEFORE UPDATE ON settings
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
