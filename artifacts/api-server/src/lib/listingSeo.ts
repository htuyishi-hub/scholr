export const SITE_ORIGIN = (process.env.SITE_URL || "https://scholr.ink").replace(/\/+$/, "");

export interface ListingSeoRecord {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  coverImage: string | null;
  category: string | null;
  country: string | null;
  fundingType: string | null;
  studyLevel: string[] | null;
  deadline: string | Date | null;
  amount: string | null;
  applyLink: string | null;
  hostOrganization: string | null;
  hostWebsite: string | null;
  requiredField?: string[] | null;
  status: string;
  seoTitle?: string | null;
  metaDescription?: string | null;
  updatedAt: string | Date | null;
  createdAt: string | Date | null;
}

export const PLACEHOLDER_TITLES = [
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

const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

export function cleanTitle(raw: string): string {
  return raw.replace(EMOJI_RE, "").replace(/\s+/g, " ").trim();
}

function normalizeForBlocklist(raw: string): string {
  return cleanTitle(raw)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPlaceholderTitle(raw: string): boolean {
  const normalized = normalizeForBlocklist(raw);
  if (!normalized) return true;
  if (PLACEHOLDER_TITLES.includes(normalized)) return true;
  return normalized.split(" ").filter((word) => word.length > 2).length < 2;
}

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function slugify(value: string): string {
  return cleanTitle(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function listingUrl(listing: ListingSeoRecord): string {
  return `${SITE_ORIGIN}/opportunity/${listing.slug}`;
}

export function displayTitle(listing: ListingSeoRecord): string {
  const title = cleanTitle(listing.title);
  if (!isPlaceholderTitle(title)) return title;
  if (listing.hostOrganization) return cleanTitle(listing.hostOrganization);
  return title || "Opportunity";
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function metaTitle(listing: ListingSeoRecord): string {
  if (listing.seoTitle) return listing.seoTitle;
  const base = displayTitle(listing);
  const year = listing.deadline ? new Date(listing.deadline).getUTCFullYear() : null;
  const withYear = year && !base.includes(String(year)) ? `${base} ${year}` : base;
  const suffix = " | scholr";
  const max = 60 - suffix.length;
  const head = withYear.length > max ? `${withYear.slice(0, max - 1).trimEnd()}...` : withYear;
  return head + suffix;
}

export function metaDescription(listing: ListingSeoRecord): string {
  if (listing.metaDescription) return listing.metaDescription;

  const name = displayTitle(listing);
  const host =
    listing.hostOrganization && !name.toLowerCase().includes(listing.hostOrganization.toLowerCase())
      ? listing.hostOrganization
      : null;
  const levels = listing.studyLevel?.filter(Boolean).join(", ");
  const parts = [host ? `${name}, offered by ${host}.` : `${name}.`];

  if (listing.amount) parts.push(`${listing.amount}.`);
  if (levels) parts.push(`For ${levels} students.`);
  parts.push(listing.deadline ? `Deadline ${formatDate(listing.deadline)}.` : "Rolling deadline.");

  let description = parts.join(" ");
  if (description.length < 120 && listing.description) {
    description += ` ${stripHtml(listing.description)}`;
  }

  description = description.replace(/\s+/g, " ").trim();
  return description.length > 158 ? `${description.slice(0, 157).trimEnd()}...` : description;
}

export function jsonLd(listing: ListingSeoRecord): object[] {
  const name = displayTitle(listing);
  const program: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    name,
    description: metaDescription(listing),
    url: listingUrl(listing),
  };

  if (listing.hostOrganization) {
    program.provider = {
      "@type": "Organization",
      name: listing.hostOrganization,
      ...(listing.hostWebsite ? { url: listing.hostWebsite } : {}),
    };
  }
  if (listing.deadline) program.applicationDeadline = new Date(listing.deadline).toISOString().slice(0, 10);
  if (listing.studyLevel?.length) program.educationalProgramMode = listing.studyLevel.join(", ");
  if (listing.coverImage) program.image = listing.coverImage;
  if (listing.amount) program.offers = { "@type": "Offer", price: listing.amount, category: "Scholarship" };

  const crumbs = [
    { name: "Home", item: SITE_ORIGIN },
    { name: "Browse", item: `${SITE_ORIGIN}/browse` },
    ...(listing.country
      ? [{ name: listing.country, item: `${SITE_ORIGIN}/countries/${slugify(listing.country)}` }]
      : []),
    { name, item: listingUrl(listing) },
  ];

  return [
    program,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.item,
      })),
    },
  ];
}

export function validateListingForPublish(listing: Partial<ListingSeoRecord>) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const title = cleanTitle(String(listing.title ?? ""));
  const slug = String(listing.slug ?? "");
  const summary = String(listing.metaDescription || listing.description || "");
  const sourceUrl = listing.applyLink || listing.hostWebsite;
  const text = `${listing.title ?? ""} ${listing.description ?? ""} ${listing.content ?? ""} ${listing.hostOrganization ?? ""}`;

  if (!title) errors.push("title: missing");
  else if (isPlaceholderTitle(title)) errors.push(`title: placeholder or too generic (${listing.title})`);

  if (!slug) errors.push("slug: missing");
  else if (slug.split("-").filter((word) => word.length > 2).length < 2) {
    errors.push(`slug: generic (${slug})`);
  }

  if (!summary.trim()) errors.push("summary: missing");
  else if (stripHtml(summary).length < 80) warnings.push("summary: shorter than 80 chars");

  if (!listing.country) {
    warnings.push("country_scope: missing");
  } else if (listing.country === "Rwanda" && !/\brwanda/i.test(text)) {
    errors.push("country_scope: says Rwanda but source text never mentions Rwanda");
  }

  if (!listing.deadline) {
    const hasRollingDeadlineSignal = /rolling|open\s+until|no\s+fixed\s+deadline|applications\s+open|continuing\s+applications|accepting\s+applications/i.test(text);
    if (hasRollingDeadlineSignal) {
      warnings.push("deadline: rolling or open-ended");
    } else {
      warnings.push("deadline: missing");
    }
  }

  if (!sourceUrl) errors.push("source_url: missing official source link");

  return { ok: errors.length === 0, errors, warnings };
}
