-- Migration: Add rich content columns to scraped_items, opportunities, and jobs
-- Phase A: Rich content, images, better slugs, transactions, duplicate detection

-- Step 1: Add rich content columns to scraped_items
ALTER TABLE scraped_items
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS plain_text TEXT,
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scraper_name TEXT,
  ADD COLUMN IF NOT EXISTS http_status INTEGER,
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS last_modified TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS etag TEXT,
  ADD COLUMN IF NOT EXISTS extraction_version TEXT DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS extraction_method TEXT;

-- Step 2: Add gallery images to opportunities
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';

-- Step 3: Add content, cover image, and gallery to jobs
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';

-- Step 4: Create indexes for faster duplicate detection and queries
CREATE INDEX IF NOT EXISTS idx_scraped_items_source_url ON scraped_items(source_url);
CREATE INDEX IF NOT EXISTS idx_scraped_items_status ON scraped_items(status);
CREATE INDEX IF NOT EXISTS idx_scraped_items_item_type ON scraped_items(item_type);
CREATE INDEX IF NOT EXISTS idx_scraped_items_scraped_at ON scraped_items(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_items_content_hash ON scraped_items(content_hash);
CREATE INDEX IF NOT EXISTS idx_opportunities_apply_link ON opportunities(apply_link);
CREATE INDEX IF NOT EXISTS idx_opportunities_slug ON opportunities(slug);
CREATE INDEX IF NOT EXISTS idx_opportunities_host_website ON opportunities(host_website);
CREATE INDEX IF NOT EXISTS idx_jobs_source_url ON jobs(source_url);
