# TODO — Scraper + Admin Approval Improvements

## Phase 1: Rich scraping (detail-page extraction)
- [ ] Update `artifacts/api-server/src/lib/scraper.ts`:
  - [ ] Add HTML sanitization + lightweight formatting preservation for scraped content.
  - [ ] For each listing page item, fetch the detail page.
  - [ ] Extract full main content (headings, paragraphs, lists) into `ScrapedResult.description` and/or `rawData`.
  - [ ] Extract `img[src]` URLs into `ScrapedResult.rawData.images`.
  - [ ] Extract specific apply links (and “official source”) and store in `ScrapedResult.applyLink` and `rawData.officialSourceUrl`.
  - [ ] Repeat for both scholarships and jobs.

## Phase 2: Persist full content on approval
- [ ] Update `artifacts/api-server/src/routes/scraper.ts` approve handler:
  - [ ] When approving scholarships, write full content into `opportunitiesTable.content` (HTML sanitized).
  - [ ] Keep a short preview in `opportunitiesTable.description`.
  - [ ] For jobs, store full extracted HTML into `jobsTable.description` (and requirements if extracted).

## Phase 3: Admin preview + edit
- [ ] Update `artifacts/scholr/src/pages/admin/scraper-panel.tsx`:
  - [ ] Extend UI model to show full sanitized HTML preview (and images grid).
  - [ ] Add an “Official source” link.
  - [ ] Allow admin edits for content and apply link.

## Phase 4: User experience
- [ ] Verify public opportunity/job pages render `opportunities.content` and show apply button.
- [ ] If needed, update React components to render stored HTML safely (sanitization already done server-side).

## Phase 5: Jobs scraper parity
- [ ] Ensure job approval creates consistent applicationLink + full description.

## Phase 6: Testing
- [ ] Run local scrape -> review pending items -> approve -> verify full rendering in user-facing pages.
- [ ] Add basic smoke checks (no external calls in tests required).

