import { Router } from "express";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db, opportunitiesTable } from "@workspace/db";

const router = Router();
const SITE_URL = (process.env.SITE_URL || "https://scholr.ink").replace(/\/+$/, "");
type SitemapUrl = {
  path: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
};

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function buildSitemapXml() {
  const [opportunities, categories, countries, institutions]: [
    Array<{ slug: string; updatedAt: Date | string | null }>,
    Array<{ category: string | null }>,
    Array<{ country: string | null }>,
    Array<{ hostOrganization: string | null }>,
  ] = await Promise.all([
    db
      .select({ slug: opportunitiesTable.slug, updatedAt: opportunitiesTable.updatedAt })
      .from(opportunitiesTable)
      .where(eq(opportunitiesTable.status, "published"))
      .orderBy(desc(opportunitiesTable.updatedAt)),
    db
      .selectDistinct({ category: opportunitiesTable.category })
      .from(opportunitiesTable)
      .where(and(eq(opportunitiesTable.status, "published"), isNotNull(opportunitiesTable.category))),
    db
      .selectDistinct({ country: opportunitiesTable.country })
      .from(opportunitiesTable)
      .where(and(eq(opportunitiesTable.status, "published"), isNotNull(opportunitiesTable.country))),
    db
      .selectDistinct({ hostOrganization: opportunitiesTable.hostOrganization })
      .from(opportunitiesTable)
      .where(and(eq(opportunitiesTable.status, "published"), isNotNull(opportunitiesTable.hostOrganization))),
  ]);

  const slugifyLocal = (v: string) =>
    v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

  const urls: SitemapUrl[] = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/browse", changefreq: "daily", priority: "0.9" },
    { path: "/jobs", changefreq: "daily", priority: "0.8" },
    { path: "/find-my-scholarship", changefreq: "weekly", priority: "0.8" },
    { path: "/about", changefreq: "monthly", priority: "0.5" },
    // Taxonomy hub index pages
    { path: "/countries", changefreq: "weekly", priority: "0.7" },
    { path: "/institutions", changefreq: "weekly", priority: "0.7" },
    { path: "/funders", changefreq: "weekly", priority: "0.7" },
    { path: "/fields", changefreq: "weekly", priority: "0.7" },
    { path: "/deadlines", changefreq: "weekly", priority: "0.7" },
    // Country taxonomy pages
    ...countries
      .map(({ country }) => country?.trim())
      .filter((country): country is string => Boolean(country))
      .map((country) => ({
        path: `/countries/${slugifyLocal(country)}`,
        changefreq: "weekly",
        priority: "0.8",
      })),
    // Institution taxonomy pages
    ...institutions
      .map(({ hostOrganization }) => hostOrganization?.trim())
      .filter((host): host is string => Boolean(host))
      .map((host) => ({
        path: `/institutions/${slugifyLocal(host)}`,
        changefreq: "weekly",
        priority: "0.8",
      })),
    // Category-based filter pages
    ...categories
      .map(({ category }) => category?.trim())
      .filter((category): category is string => Boolean(category))
      .map((category) => ({
        path: `/browse?category=${encodeURIComponent(category)}`,
        changefreq: "daily",
        priority: "0.8",
      })),
    // Individual opportunity pages
    ...opportunities.map(({ slug, updatedAt }) => ({
      path: `/opportunity/${slug}`,
      changefreq: "daily",
      priority: "0.9",
      lastmod: updatedAt ? new Date(updatedAt).toISOString() : undefined,
    })),
  ];

  const body = urls
    .map(
      ({ path, changefreq, priority, lastmod }) =>
        `  <url><loc>${escapeXml(`${SITE_URL}${path}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

router.get("/sitemap.xml", async (_req, res) => {
  try {
    res.type("application/xml").send(await buildSitemapXml());
  } catch (error) {
    res.status(500).type("application/xml").send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>Sitemap unavailable</error>");
  }
});

router.get("/ads.txt", (_req, res) => {
  res.type("text/plain").send("google.com, pub-4809337396875582, DIRECT, f08c47fec0942fa0\n");
});

export default router;