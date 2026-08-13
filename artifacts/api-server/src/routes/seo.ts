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
  const [opportunities, categories]: [
    Array<{ slug: string; updatedAt: Date | string | null }>,
    Array<{ category: string | null }>,
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
  ]);

  const urls: SitemapUrl[] = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/browse", changefreq: "daily", priority: "0.9" },
    { path: "/jobs", changefreq: "daily", priority: "0.8" },
    { path: "/find-my-scholarship", changefreq: "weekly", priority: "0.8" },
    { path: "/about", changefreq: "monthly", priority: "0.5" },
    ...categories
      .map(({ category }) => category?.trim())
      .filter((category): category is string => Boolean(category))
      .map((category) => ({
        path: `/browse?category=${encodeURIComponent(category)}`,
        changefreq: "daily",
        priority: "0.8",
      })),
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

export default router;