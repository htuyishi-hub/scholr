import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router, { taxonomyRouter } from "./routes/index.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { db, opportunitiesTable } from "@workspace/db";
import { eq, and, desc, ne, sql } from "drizzle-orm";
import {
  SITE_ORIGIN,
  slugify,
  displayTitle,
  escapeHtml,
  formatDate,
  jsonLd,
  listingUrl,
  metaDescription,
  metaTitle,
  stripHtml,
  type ListingSeoRecord,
} from "./lib/listingSeo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const frontendPublicDir = path.resolve(__dirname, "..", "..", "scholr", "dist", "public");

// The frontend is deployed separately (Vercel). When this build does not ship
// a bundled SPA, the API runs in pure API mode and never tries to serve HTML.
const serveFrontend =
  process.env.SERVE_FRONTEND !== "false" &&
  fs.existsSync(path.join(frontendPublicDir, "index.html"));
const frontendIndexPath = path.join(frontendPublicDir, "index.html");

// When the API runs as a Vercel serverless function (SERVE_FRONTEND=false),
// the built index.html is embedded at bundle time by build-vercel.mjs so the
// /opportunity/:slug and taxonomy SEO handlers can inject per-page metadata
// without needing the full SPA output directory on disk.
const embeddedIndexHtml: string | null =
  typeof (globalThis as any).__SCHOLR_INDEX_HTML__ === "string"
    ? (globalThis as any).__SCHOLR_INDEX_HTML__ as string
    : null;

function getIndexHtml(): string | null {
  if (serveFrontend) {
    try {
      return fs.readFileSync(frontendIndexPath, "utf8");
    } catch {
      return null;
    }
  }
  return embeddedIndexHtml;
}

// Cross-origin browsers (Vercel frontend -> Render API) must be allow-listed.
// Set CORS_ORIGINS to a comma-separated list of exact origins, e.g.
// "https://scholr.vercel.app,https://www.scholr.com". "*" allows everything.
const allowedOrigins = (process.env.CORS_ORIGINS ?? "*")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const allowAllOrigins = allowedOrigins.includes("*");

const corsOptions: Parameters<typeof cors>[0] = {
  origin(origin, callback) {
    // Same-origin / server-to-server requests have no Origin header.
    if (!origin || allowAllOrigins || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};


import { logger } from "./lib/logger.js";

const app: Express = express();

// Baseline security headers for every response (Lighthouse "Best Practices").
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use((req, res, next) => {
  const host = req.headers.host;
  if (host?.toLowerCase() === "www.scholr.ink") {
    // Explicitly set CORS headers on the redirect response so browsers
    // don't block the redirected fetch (fixes www -> bare domain CORS errors).
    const origin = req.headers.origin;
    if (origin && (allowAllOrigins || allowedOrigins.includes(origin))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.redirect(301, `${SITE_ORIGIN}${req.originalUrl}`);
    return;
  }
  next();
});

function replaceOrInsertHeadTag(html: string, pattern: RegExp, tag: string) {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function buildOpportunityPrerender(listing: ListingSeoRecord, related: { title: string; slug: string; country: string | null; deadline: string | Date | null }[] = []) {
  const title = displayTitle(listing);
  const description = metaDescription(listing);
  const facts = [
    listing.hostOrganization ? `Institution: ${listing.hostOrganization}` : null,
    listing.country ? `Country: ${listing.country}` : null,
    listing.amount ? `Funding: ${listing.amount}` : null,
    listing.deadline ? `Deadline: ${formatDate(listing.deadline)}` : "Deadline: Rolling/Ongoing",
    listing.applyLink || listing.hostWebsite ? `Official source: ${listing.applyLink || listing.hostWebsite}` : null,
    listing.updatedAt ? `Verified: ${formatDate(listing.updatedAt)}` : null,
  ].filter(Boolean);
  const body = stripHtml(listing.content || listing.description || description).slice(0, 2000);

  const crumbs = [
    `<a href="${SITE_ORIGIN}/">Home</a>`,
    listing.country
      ? `<a href="${SITE_ORIGIN}/countries/${slugify(listing.country)}">${escapeHtml(listing.country)}</a>`
      : `<a href="${SITE_ORIGIN}/browse">Browse</a>`,
    escapeHtml(title),
  ].join(" > ");

  const relatedHtml = related.length
    ? `<section class="seo-related" aria-label="Related opportunities"><h2>Related Opportunities</h2><ul>${related
        .map(
          (r) =>
            `<li><a href="${SITE_ORIGIN}/opportunity/${r.slug}">${escapeHtml(r.title)}</a>${r.deadline ? ` — Deadline: ${formatDate(r.deadline)}` : ""}</li>`,
        )
        .join("")}</ul></section>`
    : "";

  return [
    '<main class="seo-prerender" aria-label="Opportunity preview">',
    `<nav class="seo-breadcrumbs" aria-label="Breadcrumb">${crumbs}</nav>`,
    `<article>`,
    `<h1>${escapeHtml(title)}</h1>`,
    `<p>${escapeHtml(description)}</p>`,
    facts.length ? `<ul>${facts.map((fact) => `<li>${escapeHtml(String(fact))}</li>`).join("")}</ul>` : "",
    body && body !== description ? `<section><p>${escapeHtml(body)}</p></section>` : "",
    `</article>`,
    relatedHtml,
    "</main>",
  ].join("");
}

function injectOpportunitySeo(
  html: string,
  listing: ListingSeoRecord,
  related: { title: string; slug: string; country: string | null; deadline: string | Date | null }[] = [],
) {
  const title = metaTitle(listing);
  const description = metaDescription(listing);
  const canonical = listingUrl(listing);
  const image = listing.coverImage || `${SITE_ORIGIN}/opengraph.jpg`;
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const escapedCanonical = escapeHtml(canonical);
  const escapedImage = escapeHtml(image);
  const schema = escapeHtml(JSON.stringify(jsonLd(listing)));

  let next = html;
  next = replaceOrInsertHeadTag(next, /<title>.*?<\/title>/is, `<title>${escapedTitle}</title>`);
  next = replaceOrInsertHeadTag(next, /<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${escapedDescription}" />`);
  next = replaceOrInsertHeadTag(next, /<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapedCanonical}" />`);
  next = replaceOrInsertHeadTag(next, /<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="article" />`);
  next = replaceOrInsertHeadTag(next, /<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapedTitle}" />`);
  next = replaceOrInsertHeadTag(next, /<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapedDescription}" />`);
  next = replaceOrInsertHeadTag(next, /<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${escapedCanonical}" />`);
  next = replaceOrInsertHeadTag(next, /<meta\s+property="og:image"[^>]*>/i, `<meta property="og:image" content="${escapedImage}" />`);
  next = replaceOrInsertHeadTag(next, /<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapedTitle}" />`);
  next = replaceOrInsertHeadTag(next, /<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapedDescription}" />`);
  next = replaceOrInsertHeadTag(next, /<meta\s+name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${escapedImage}" />`);
  next = next.replace("</head>", `    <script type="application/ld+json">${schema}</script>\n  </head>`);
  return next.replace('<div id="root"></div>', `<div id="root">${buildOpportunityPrerender(listing, related)}</div>`);
}

// Per-listing server-rendered SEO: injects correct canonical, title,
// description, OpenGraph, Twitter, JSON-LD, and a prerendered content block
// into index.html so raw HTTP fetches (Googlebot without JS) see unique
// per-page metadata. Runs in both modes — Render (reads from disk) and
// Vercel serverless (reads from the embedded HTML constant).
app.get("/opportunity/:slug", async (req, res, next) => {
  try {
    const [listing] = await db
      .select()
      .from(opportunitiesTable)
      .where(eq(opportunitiesTable.slug, req.params.slug))
      .limit(1);

    if (!listing || listing.status !== "published") {
      return next();
    }

    const html = getIndexHtml();
    if (!html) return next();

    // Fetch related listings (same category or country, excluding current)
    const relatedConditions = [
      eq(opportunitiesTable.status, "published"),
      ne(opportunitiesTable.id, listing.id),
    ];
    if (listing.category) relatedConditions.push(eq(opportunitiesTable.category, listing.category));
    else if (listing.country) relatedConditions.push(eq(opportunitiesTable.country, listing.country));

    const related = await db
      .select({
        title: opportunitiesTable.title,
        slug: opportunitiesTable.slug,
        country: opportunitiesTable.country,
        deadline: opportunitiesTable.deadline,
      })
      .from(opportunitiesTable)
      .where(and(...relatedConditions))
      .orderBy(desc(opportunitiesTable.createdAt))
      .limit(3);

    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
    res.type("html").send(injectOpportunitySeo(html, listing as ListingSeoRecord, related as { title: string; slug: string; country: string | null; deadline: string | Date | null }[]));
  } catch (error) {
    next(error);
  }
});

// Taxonomy hub pages — server-rendered SEO HTML for /countries/:slug,
// /institutions/:slug, /funders/:slug, /fields/:slug, /deadlines/:month-year.
// Same dual-mode pattern as /opportunity/:slug above.
app.use(taxonomyRouter);

// Serve the built React frontend from the monorepo's Vite output when it is
// bundled alongside the API (single-service Render deploy).
if (serveFrontend) {
  app.use(
    express.static(frontendPublicDir, {
      index: false,
      etag: true,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "public, max-age=3600");
        }
      },
    }),
  );

  // For SPA routes (anything not starting with /api), fall back to index.html.
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/") || req.path === "/api") {
      return next();
    }

    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(frontendPublicDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

export default app;
