import { Router } from "express";
import { db, opportunitiesTable } from "@workspace/db";
import { eq, and, desc, sql, isNotNull } from "drizzle-orm";
import {
  SITE_ORIGIN,
  slugify,
  escapeHtml,
  formatDate,
  stripHtml,
  displayTitle,
  listingUrl,
  type ListingSeoRecord,
} from "../lib/listingSeo.js";

const router = Router();

interface TaxonomyListing {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  country: string | null;
  category: string | null;
  fundingType: string | null;
  deadline: string | Date | null;
  amount: string | null;
  coverImage: string | null;
  hostOrganization: string | null;
  updatedAt: string | Date | null;
}

function listingCardHtml(opp: TaxonomyListing): string {
  const title = escapeHtml(displayTitle(opp as ListingSeoRecord));
  const url = `${SITE_ORIGIN}/opportunity/${opp.slug}`;
  const desc = escapeHtml(
    stripHtml(opp.description || "")
      .slice(0, 140)
      .trim(),
  );
  const deadlineText = opp.deadline
    ? `Deadline: ${formatDate(opp.deadline)}`
    : "Rolling deadline";
  const country = opp.country ? escapeHtml(opp.country) : "";
  const funding =
    opp.fundingType === "full"
      ? "Fully Funded"
      : opp.fundingType === "partial"
        ? "Partial Funding"
        : opp.fundingType || "";

  return [
    '<article class="taxonomy-card">',
    `<h2><a href="${url}">${title}</a></h2>`,
    `<p>${desc}</p>`,
    `<ul>`,
    country ? `<li>Country: ${country}</li>` : "",
    funding ? `<li>Funding: ${funding}</li>` : "",
    `<li>${escapeHtml(deadlineText)}</li>`,
    `</ul>`,
    `</article>`,
  ]
    .filter(Boolean)
    .join("");
}

function taxonomyPageHtml(opts: {
  hubType: string;
  hubLabel: string;
  slug: string;
  pageTitle: string;
  description: string;
  listings: TaxonomyListing[];
  indexHtml: string;
}): string {
  const { pageTitle, description, listings, hubType, hubLabel, slug, indexHtml } = opts;
  const canonical = `${SITE_ORIGIN}/${hubType}/${slug}`;
  const escapedTitle = escapeHtml(pageTitle);
  const escapedDescription = escapeHtml(description);
  const escapedCanonical = escapeHtml(canonical);

  const cardsHtml = listings.length
    ? `<section class="taxonomy-listings"><h1>${escapedTitle}</h1><p>${escapedDescription}</p>${listings.map(listingCardHtml).join("")}</section>`
    : `<section class="taxonomy-listings"><h1>${escapedTitle}</h1><p>${escapedDescription}</p><p>No opportunities found in this category yet. Check back soon.</p></section>`;

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_ORIGIN },
      { "@type": "ListItem", position: 2, name: hubLabel, item: `${SITE_ORIGIN}/${hubType}` },
      { "@type": "ListItem", position: 3, name: pageTitle.replace(" | scholr", ""), item: canonical },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description,
    url: canonical,
    hasPart: listings.slice(0, 20).map((l) => ({
      "@type": "EducationalOccupationalProgram",
      name: displayTitle(l as ListingSeoRecord),
      url: listingUrl(l as ListingSeoRecord),
    })),
  };

  function replaceOrInsert(pattern: RegExp, tag: string): string {
    if (pattern.test(indexHtml)) return indexHtml.replace(pattern, tag);
    return indexHtml.replace("</head>", `    ${tag}\n  </head>`);
  }

  let next = replaceOrInsert(/<title>.*?<\/title>/is, `<title>${escapedTitle}</title>`);
  next = replaceOrInsert(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${escapedDescription}" />`);
  next = replaceOrInsert(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapedCanonical}" />`);
  next = replaceOrInsert(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapedTitle}" />`);
  next = replaceOrInsert(/<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapedDescription}" />`);
  next = replaceOrInsert(/<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${escapedCanonical}" />`);
  next = replaceOrInsert(/<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapedTitle}" />`);
  next = replaceOrInsert(/<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapedDescription}" />`);
  const jsonLdStr = escapeHtml(JSON.stringify([collectionJsonLd, breadcrumbs]));
  next = next.replace("</head>", `    <script type="application/ld+json">${jsonLdStr}</script>\n  </head>`);
  return next.replace('<div id="root"></div>', `<div id="root"><main class="seo-prerender" aria-label="${escapeHtml(hubLabel)} listings">${cardsHtml}</main></div>`);
}

function getEmbeddedIndexHtml(): string | null {
  if (typeof (globalThis as any).__SCHOLR_INDEX_HTML__ === "string") {
    return (globalThis as any).__SCHOLR_INDEX_HTML__ as string;
  }
  try {
    const fs = require("fs") as typeof import("fs");
    const pathMod = require("path") as typeof import("path");
    const { fileURLToPath } = require("url") as typeof import("url");
    const dir = pathMod.dirname(fileURLToPath(import.meta.url));
    const idx = pathMod.resolve(dir, "..", "..", "scholr", "dist", "public", "index.html");
    return fs.readFileSync(idx, "utf8");
  } catch {
    return null;
  }
}

function sendTaxonomyPage(
  res: import("express").Response,
  opts: { hubType: string; hubLabel: string; slug: string; pageTitle: string; description: string; listings: TaxonomyListing[]; indexHtml: string | null },
) {
  if (!opts.indexHtml) {
    res.status(404).send("Not found");
    return;
  }
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  res.type("html").send(
    taxonomyPageHtml({
      hubType: opts.hubType,
      hubLabel: opts.hubLabel,
      slug: opts.slug,
      pageTitle: opts.pageTitle,
      description: opts.description,
      listings: opts.listings,
      indexHtml: opts.indexHtml,
    }),
  );
}

function titleCase(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Countries ──────────────────────────────────────────────
router.get("/countries/:slug", async (req, res, next) => {
  try {
    const countries = await db
      .selectDistinct({ country: opportunitiesTable.country })
      .from(opportunitiesTable)
      .where(and(eq(opportunitiesTable.status, "published"), isNotNull(opportunitiesTable.country)));

    const matched = countries.find(
      (c: { country: string | null }) => c.country && slugify(c.country) === req.params.slug,
    );
    if (!matched?.country) return next();

    const listings = (await db
      .select({
        id: opportunitiesTable.id,
        title: opportunitiesTable.title,
        slug: opportunitiesTable.slug,
        description: opportunitiesTable.description,
        country: opportunitiesTable.country,
        category: opportunitiesTable.category,
        fundingType: opportunitiesTable.fundingType,
        deadline: opportunitiesTable.deadline,
        amount: opportunitiesTable.amount,
        coverImage: opportunitiesTable.coverImage,
        hostOrganization: opportunitiesTable.hostOrganization,
        updatedAt: opportunitiesTable.updatedAt,
      })
      .from(opportunitiesTable)
      .where(and(eq(opportunitiesTable.status, "published"), eq(opportunitiesTable.country, matched.country)))
      .orderBy(desc(opportunitiesTable.updatedAt))
      .limit(100)) as TaxonomyListing[];

    const country = matched.country;
    const pageTitle = `${country} Scholarships, Fellowships & Grants 2026 | scholr`;
    const description = `Browse ${listings.length}+ verified scholarships, fellowships and grants for students in ${country}. Find fully funded opportunities with deadlines, eligibility and how to apply.`;

    sendTaxonomyPage(res, {
      hubType: "countries",
      hubLabel: "Countries",
      slug: req.params.slug,
      pageTitle,
      description,
      listings,
      indexHtml: getEmbeddedIndexHtml(),
    });
  } catch (error) {
    next(error);
  }
});

// ── Institutions ───────────────────────────────────────────
router.get("/institutions/:slug", async (req, res, next) => {
  try {
    const institutions = await db
      .selectDistinct({ host: opportunitiesTable.hostOrganization })
      .from(opportunitiesTable)
      .where(and(eq(opportunitiesTable.status, "published"), isNotNull(opportunitiesTable.hostOrganization)));

    const matched = institutions.find(
      (i: { host: string | null }) => i.host && slugify(i.host) === req.params.slug,
    );
    if (!matched?.host) return next();

    const listings = (await db
      .select({
        id: opportunitiesTable.id,
        title: opportunitiesTable.title,
        slug: opportunitiesTable.slug,
        description: opportunitiesTable.description,
        country: opportunitiesTable.country,
        category: opportunitiesTable.category,
        fundingType: opportunitiesTable.fundingType,
        deadline: opportunitiesTable.deadline,
        amount: opportunitiesTable.amount,
        coverImage: opportunitiesTable.coverImage,
        hostOrganization: opportunitiesTable.hostOrganization,
        updatedAt: opportunitiesTable.updatedAt,
      })
      .from(opportunitiesTable)
      .where(and(eq(opportunitiesTable.status, "published"), eq(opportunitiesTable.hostOrganization, matched.host)))
      .orderBy(desc(opportunitiesTable.updatedAt))
      .limit(100)) as TaxonomyListing[];

    const inst = matched.host;
    const pageTitle = `${inst} Scholarships & Programs 2026 | scholr`;
    const description = `Browse ${listings.length}+ scholarships, fellowships and programs offered by ${inst}. Find funding details, deadlines, eligibility and how to apply.`;

    sendTaxonomyPage(res, {
      hubType: "institutions",
      hubLabel: "Institutions",
      slug: req.params.slug,
      pageTitle,
      description,
      listings,
      indexHtml: getEmbeddedIndexHtml(),
    });
  } catch (error) {
    next(error);
  }
});

// ── Funders ────────────────────────────────────────────────
router.get("/funders/:slug", async (req, res, next) => {
  try {
    const hosts = await db
      .selectDistinct({ host: opportunitiesTable.hostOrganization })
      .from(opportunitiesTable)
      .where(and(eq(opportunitiesTable.status, "published"), isNotNull(opportunitiesTable.hostOrganization)));

    const matched = hosts.find(
      (h: { host: string | null }) => h.host && slugify(h.host) === req.params.slug,
    );

    const whereCondition = matched?.host
      ? and(eq(opportunitiesTable.status, "published"), eq(opportunitiesTable.hostOrganization, matched.host))
      : and(
          eq(opportunitiesTable.status, "published"),
          eq(opportunitiesTable.category, titleCase(req.params.slug)),
        );

    const listings = (await db
      .select({
        id: opportunitiesTable.id,
        title: opportunitiesTable.title,
        slug: opportunitiesTable.slug,
        description: opportunitiesTable.description,
        country: opportunitiesTable.country,
        category: opportunitiesTable.category,
        fundingType: opportunitiesTable.fundingType,
        deadline: opportunitiesTable.deadline,
        amount: opportunitiesTable.amount,
        coverImage: opportunitiesTable.coverImage,
        hostOrganization: opportunitiesTable.hostOrganization,
        updatedAt: opportunitiesTable.updatedAt,
      })
      .from(opportunitiesTable)
      .where(whereCondition)
      .orderBy(desc(opportunitiesTable.updatedAt))
      .limit(100)) as TaxonomyListing[];

    if (!listings.length) return next();

    const funderName = matched?.host || titleCase(req.params.slug);
    const pageTitle = `${funderName} Funded Scholarships & Programs 2026 | scholr`;
    const description = `Browse ${listings.length}+ scholarships and programs funded by ${funderName}. Find fully funded opportunities with deadlines, eligibility and how to apply.`;

    sendTaxonomyPage(res, {
      hubType: "funders",
      hubLabel: "Funders",
      slug: req.params.slug,
      pageTitle,
      description,
      listings,
      indexHtml: getEmbeddedIndexHtml(),
    });
  } catch (error) {
    next(error);
  }
});

// ── Fields ─────────────────────────────────────────────────
router.get("/fields/:slug", async (req, res, next) => {
  try {
    const fieldLabel = titleCase(req.params.slug);

    let listings = (await db
      .select({
        id: opportunitiesTable.id,
        title: opportunitiesTable.title,
        slug: opportunitiesTable.slug,
        description: opportunitiesTable.description,
        country: opportunitiesTable.country,
        category: opportunitiesTable.category,
        fundingType: opportunitiesTable.fundingType,
        deadline: opportunitiesTable.deadline,
        amount: opportunitiesTable.amount,
        coverImage: opportunitiesTable.coverImage,
        hostOrganization: opportunitiesTable.hostOrganization,
        updatedAt: opportunitiesTable.updatedAt,
      })
      .from(opportunitiesTable)
      .where(
        and(
          eq(opportunitiesTable.status, "published"),
          sql`${opportunitiesTable.requiredField}::text ILIKE ${`%${fieldLabel}%`}`,
        ),
      )
      .orderBy(desc(opportunitiesTable.updatedAt))
      .limit(100)) as TaxonomyListing[];

    if (!listings.length) {
      listings = (await db
        .select({
          id: opportunitiesTable.id,
          title: opportunitiesTable.title,
          slug: opportunitiesTable.slug,
          description: opportunitiesTable.description,
          country: opportunitiesTable.country,
          category: opportunitiesTable.category,
          fundingType: opportunitiesTable.fundingType,
          deadline: opportunitiesTable.deadline,
          amount: opportunitiesTable.amount,
          coverImage: opportunitiesTable.coverImage,
          hostOrganization: opportunitiesTable.hostOrganization,
          updatedAt: opportunitiesTable.updatedAt,
        })
        .from(opportunitiesTable)
        .where(
          and(
            eq(opportunitiesTable.status, "published"),
            sql`LOWER(${opportunitiesTable.category}) = LOWER(${fieldLabel})`,
          ),
        )
        .orderBy(desc(opportunitiesTable.updatedAt))
        .limit(100)) as TaxonomyListing[];
    }

    if (!listings.length) return next();

    const pageTitle = `${fieldLabel} Scholarships & Grants 2026 | scholr`;
    const description = `Browse ${listings.length}+ scholarships, fellowships and grants in ${fieldLabel}. Find funding for your field with deadlines, eligibility and how to apply.`;

    sendTaxonomyPage(res, {
      hubType: "fields",
      hubLabel: "Fields of Study",
      slug: req.params.slug,
      pageTitle,
      description,
      listings,
      indexHtml: getEmbeddedIndexHtml(),
    });
  } catch (error) {
    next(error);
  }
});

// ── Deadlines by month ─────────────────────────────────────
router.get("/deadlines/:monthYear", async (req, res, next) => {
  try {
    const monthYear = req.params.monthYear;
    const match = monthYear.match(/^([a-z]+)-(\d{4})$/i);
    if (!match) return next();

    const [, monthName, yearStr] = match;
    const year = parseInt(yearStr, 10);
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    if (isNaN(monthIndex)) return next();

    const startDate = new Date(Date.UTC(year, monthIndex, 1)).toISOString().slice(0, 10);
    const endDate = new Date(Date.UTC(year, monthIndex + 1, 0)).toISOString().slice(0, 10);

    const listings = (await db
      .select({
        id: opportunitiesTable.id,
        title: opportunitiesTable.title,
        slug: opportunitiesTable.slug,
        description: opportunitiesTable.description,
        country: opportunitiesTable.country,
        category: opportunitiesTable.category,
        fundingType: opportunitiesTable.fundingType,
        deadline: opportunitiesTable.deadline,
        amount: opportunitiesTable.amount,
        coverImage: opportunitiesTable.coverImage,
        hostOrganization: opportunitiesTable.hostOrganization,
        updatedAt: opportunitiesTable.updatedAt,
      })
      .from(opportunitiesTable)
      .where(
        and(
          eq(opportunitiesTable.status, "published"),
          sql`${opportunitiesTable.deadline} >= ${startDate}`,
          sql`${opportunitiesTable.deadline} <= ${endDate}`,
        ),
      )
      .orderBy(desc(opportunitiesTable.deadline))
      .limit(100)) as TaxonomyListing[];

    if (!listings.length) return next();

    const displayMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();
    const pageTitle = `Scholarships with Deadlines in ${displayMonth} ${year} | scholr`;
    const description = `Browse ${listings.length}+ scholarships, fellowships and grants with deadlines in ${displayMonth} ${year}. Apply before time runs out.`;

    sendTaxonomyPage(res, {
      hubType: "deadlines",
      hubLabel: "Deadlines",
      slug: monthYear,
      pageTitle,
      description,
      listings,
      indexHtml: getEmbeddedIndexHtml(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
