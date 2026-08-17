# TODO

## Completed

### JWT Auth — Phase 1
- [x] Add `jose` dependency to `artifacts/api-server/package.json`
- [x] Update `artifacts/api-server/src/lib/auth.ts` to sign/verify JWT using `process.env.JWT_SECRET`
- [x] Update `artifacts/api-server/src/routes/auth.ts` and `student.ts` to issue JWT
- [x] Fix all async `getUserIdFromToken` call sites
- [x] Verify build (`pnpm run build` succeeds)

### Phase A — Scraper Pipeline Improvements (COMPLETE)

#### Schema & Migration
- [x] `lib/db/src/schema/scraped-items.ts` — Added content, plainText, coverImage, images[], confidence, scraperName, httpStatus, contentHash, lastModified (TIMESTAMPTZ), etag, extractionVersion, extractionMethod
- [x] `lib/db/src/schema/opportunities.ts` — Added galleryImages[]
- [x] `lib/db/src/schema/jobs.ts` — Added content, coverImage, galleryImages[]
- [x] `scholr_migration_v2.sql` — All columns with defaults + 9 indexes

#### Scraper Route — Fully Rewritten
- [x] Rich content stored in staging (content, plainText, images[])
- [x] Approval publishes full article content (not just description)
- [x] Images as first-class data: coverImage + galleryImages[]
- [x] DB transactions around approval
- [x] Multi-level duplicate detection (sourceUrl → applyLink → normalized title)
- [x] Clean slugs without timestamps (sequential -2, -3 suffixes)
- [x] Richer statistics (GET /api/scraper/stats)
- [x] Future auto-approval foundation (confidence field)
- [x] New endpoints: GET /scraper/status, GET /scraper/items/:id, GET /scraper/stats


- [x] Scraper module files created (universities, government, scholarship-providers, aggregators, jobs, un-ngos, tech-fellowships)

## Remaining
- [ ] Implement scraper source functions in each scraper module file
- [ ] Expand to 100+ sources as documented in the task
- [ ] Update docs / environment variable notes
