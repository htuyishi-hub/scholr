# Deployment: API on Render, frontend on Vercel

The repo is a pnpm workspace. Each platform builds only the package it needs.

## Backend — Render

`render.yaml` deploys `@workspace/api-server` alone.

- Build: `corepack enable && pnpm install --frozen-lockfile && pnpm -r --filter @workspace/api-server... run build`
- Start: `cd artifacts/api-server && pnpm start`
- Health check: `/api/healthz`

Environment variables:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `SERVE_FRONTEND` | `false` (API-only mode — no SPA fallback) |
| `CORS_ORIGINS` | `https://<your-app>.vercel.app,https://<your-domain>` |
| `DATABASE_URL` | Supabase/Postgres connection string |
| `JWT_SECRET` | generated |

`CORS_ORIGINS` must list **exact origins** (scheme + host, no trailing slash).
Vercel preview deployments use changing subdomains, so add the preview URL you
actually test with, or set `CORS_ORIGINS=*` while testing (no cookies are used —
auth is a Bearer token — so `*` is safe but not recommended for production).

If the API build ever bundles the SPA again, unset `SERVE_FRONTEND`: the server
auto-detects `artifacts/scholr/dist/public/index.html` and serves it.

## Frontend — Vercel

Import the repo and keep **Root Directory = repository root**; `vercel.json`
does the rest:

- Install: `corepack enable && pnpm install --frozen-lockfile`
- Build: `pnpm -r --filter @workspace/scholr... run build`
- Output: `artifacts/scholr/dist/public`
- SPA rewrite: every non-asset path serves `index.html`
- `/assets/*` served immutable for a year

Environment variables (Production **and** Preview):

| Key | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://scholarship-api.onrender.com` (no trailing slash) |

Without `VITE_API_BASE_URL` the SPA calls its own Vercel origin and every
`/api/*` request 404s. See `artifacts/scholr/.env.example`.

## Order of operations

1. Deploy the API on Render, note its URL.
2. Deploy the frontend on Vercel with `VITE_API_BASE_URL` pointing at it.
3. Set `CORS_ORIGINS` on Render to the Vercel domain(s) and redeploy the API.

## API on Vercel (same origin)

The Express API now ships as a Vercel Node Serverless Function so
`https://www.scholr.ink/api/*` is served by the same deployment as the SPA
(previously those requests hit the static build and returned `405 Method Not
Allowed`).

How it works:

- `artifacts/api-server/build-vercel.mjs` bundles `src/app.ts` into
  `api/_server.mjs` during the Vercel build (file is gitignored).
- `api/index.mjs` exports that Express app as the function handler.
- `vercel.json` rewrites `/api/(.*)` -> `/api/index`.

Required Vercel Project -> Settings -> Environment Variables (Production +
Preview):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Postgres/Supabase connection string (pooled, `sslmode=require`) |
| `JWT_SECRET` | Auth token signing secret |
| `NODE_ENV` | `production` |
| `SERVE_FRONTEND` | `false` |

Add any optional integration keys (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`AUTH0_*`, storage keys) the same way. Redeploy after saving them — without
`DATABASE_URL` login returns `500`, and without a deploy the rewrite is not
active.
