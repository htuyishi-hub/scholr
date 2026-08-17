#!/usr/bin/env node
/**
 * Phase 1 data-quality gate + backfill report.
 *
 *   pnpm audit:listings
 *   pnpm audit:listings -- --suggest
 *   SCHOLR_API=http://localhost:3000 pnpm audit:listings
 *
 * validateListing() is exported so ingest/publish paths can use the same gate.
 */

const API = process.env.SCHOLR_API ?? "https://scholr.ink";

const PLACEHOLDER_TITLES = [
  "the scholarship",
  "announcement",
  "announcements",
  "opportunity",
  "opportunities",
  "scholarship",
  "scholarships",
  "untitled",
  "new post",
  "news",
  "the program",
  "programme",
  "apply now",
  "test",
];

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

const clean = (value) => (value ?? "").replace(EMOJI_RE, "").replace(/\s+/g, " ").trim();
const norm = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const slugify = (value) =>
  clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const SCOPE_HINTS = [
  ["United Kingdom", /\b(oxford|cambridge|chevening|commonwealth|united kingdom|\buk\b)\b/i],
  ["Turkiye", /\b(turkiye|turkey)\b/i],
  ["Australia", /\baustralia awards?\b|\baustralian?\b/i],
  ["Germany", /\bdaad\b|\bgerman(y)?\b/i],
  ["United States", /\bfulbright\b|\bunited states\b|\busa\b/i],
  ["Africa", /\bmastercard foundation\b|\bafrican union\b|\bpan-?african\b/i],
  ["Rwanda", /\brwanda(n)?\b|\bmineduc\b|\bkigali\b/i],
  ["Global", /\b(worldwide|any country|all nationalities|globally)\b/i],
];

function hasPlaceholderTitle(title) {
  const normalized = norm(title);
  if (!normalized) return true;
  if (PLACEHOLDER_TITLES.includes(normalized)) return true;
  return normalized.split(" ").filter((word) => word.length > 2).length < 2;
}

export function validateListing(listing) {
  const errors = [];
  const warnings = [];
  const title = clean(listing.title);

  if (!title) errors.push("title: missing");
  else if (hasPlaceholderTitle(title)) errors.push(`title: placeholder or too generic (${JSON.stringify(listing.title)})`);

  if (listing.title !== title) warnings.push("title: contains emoji or extra whitespace");
  if (title && title === title.toLowerCase()) warnings.push("title: not title-cased");
  if (listing.hostOrganization && title && !norm(title).includes(norm(listing.hostOrganization).split(" ")[0])) {
    warnings.push(`title: does not mention likely funder (${listing.hostOrganization})`);
  }

  if (!listing.slug) errors.push("slug: missing");
  else if (listing.slug.split("-").filter((word) => word.length > 2).length < 2) {
    errors.push(`slug: generic (${JSON.stringify(listing.slug)})`);
  }

  const summary = clean(listing.metaDescription || listing.description);
  if (!summary) errors.push("summary: missing");
  else if (summary.length < 80) warnings.push("summary: shorter than 80 chars");

  if (!listing.country) errors.push("country_scope: missing");
  else {
    const text = `${listing.title} ${listing.description ?? ""} ${listing.content ?? ""} ${listing.hostOrganization ?? ""}`;
    if (listing.country === "Rwanda" && !/\brwanda/i.test(text)) {
      errors.push("country_scope: says Rwanda but source text never mentions Rwanda");
    }
  }

  if (!listing.deadline) errors.push("deadline: missing (use an explicit date or Rolling/Ongoing)");
  else if (Number.isFinite(new Date(listing.deadline).getTime()) && new Date(listing.deadline) < new Date()) {
    warnings.push(`deadline: in the past (${listing.deadline})`);
  }

  if (!listing.applyLink && !listing.hostWebsite) errors.push("source_url: missing official source link");
  if (!listing.updatedAt) warnings.push("last_verified: missing");
  if (listing.coverImage && !/scholr\.ink|supabase\.co/.test(listing.coverImage)) {
    warnings.push("coverImage: hotlinked from a third party");
  }

  return { ok: errors.length === 0, errors, warnings };
}

function suggest(listing) {
  const text = `${listing.title} ${listing.description ?? ""} ${listing.content ?? ""} ${listing.hostOrganization ?? ""}`;
  const scope = SCOPE_HINTS.find(([, pattern]) => pattern.test(text))?.[0] ?? "Global";
  let title = clean(listing.title);

  if (hasPlaceholderTitle(title) && listing.hostOrganization) {
    title = /scholarship|fellowship|grant|award/i.test(listing.hostOrganization)
      ? listing.hostOrganization
      : `${listing.hostOrganization} Scholarship`;
  }

  if (title === title.toLowerCase()) {
    const small = new Set(["for", "and", "with", "of", "the", "in", "to", "a", "an", "at", "on"]);
    title = title
      .split(" ")
      .map((word, index) =>
        index > 0 && small.has(word.replace(/[^a-z]/g, ""))
          ? word
          : word.charAt(0).toUpperCase() + word.slice(1),
      )
      .join(" ");
  }

  return { title, slug: slugify(title), country: scope };
}

async function main() {
  const response = await fetch(`${API.replace(/\/+$/, "")}/api/opportunities?limit=1000&status=published`);
  if (!response.ok) throw new Error(`API returned ${response.status}`);

  const data = await response.json();
  const items = Array.isArray(data) ? data : data.items ?? [];
  const wantSuggest = process.argv.includes("--suggest");
  let failed = 0;

  for (const listing of items) {
    const { ok, errors, warnings } = validateListing(listing);
    if (!ok) failed += 1;

    console.log(`\n${ok ? "PASS" : "FAIL"}  /opportunity/${listing.slug}`);
    console.log(`      title: ${JSON.stringify(listing.title)}`);
    for (const error of errors) console.log(`   x  ${error}`);
    for (const warning of warnings) console.log(`   !  ${warning}`);

    if (wantSuggest && (!ok || warnings.length)) {
      const suggested = suggest(listing);
      console.log(`   -> suggested title:   ${suggested.title}`);
      console.log(`   -> suggested slug:    ${suggested.slug}${suggested.slug !== listing.slug ? " (add a 301 from the old slug)" : ""}`);
      console.log(`   -> suggested country: ${suggested.country}`);
    }
  }

  console.log(`\n${items.length - failed}/${items.length} listings pass the gate.`);
  process.exit(failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

