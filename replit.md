# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Editorial Workspace

A professional CMS-style editorial workspace lives at `/admin/editorial`. It replaces the basic scraper panel with a full publishing pipeline.

**Pipeline states:** `needs_review` → `needs_images` | `needs_metadata` | `needs_verification` | `scheduled` → `published` | `archived` | `rejected`

**Key pages:**
- `/admin/editorial` — queue view with pipeline tabs, quality scores, bulk operations
- `/admin/editorial/:id` — per-item workspace: content editor, sections, media, metadata, eligibility, audit timeline

**DB migration required:** Run `scholr_migration_v3.sql` to add editorial columns to `scraped_items`.

**New API routes:**
- `GET /api/scraper/queue-counts` — per-status counts for pipeline tabs
- `PATCH /api/scraper/items/:id` — partial field update (triggers quality score recompute)
- `PUT /api/scraper/items/:id/status` — status transition with audit logging
- `POST /api/scraper/items/bulk` — bulk approve/reject/archive/categorize

**Quality score:** 0-100 computed from title, description, content length, cover image, apply link, deadline, country, category, gallery. Logic in `artifacts/scholr/src/lib/quality-score.ts`.

## Environment Variables Required

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — admin authentication
- Auth0 credentials (student login via Google)
- `PORT` — set by Replit workflow config

## User preferences

- Keep existing project structure; do not restructure or migrate unless asked.
- pnpm@10.26.1 is the installed version (Nix). `packageManager` field in package.json reflects this.
