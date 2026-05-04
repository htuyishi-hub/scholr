import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const SETTING_KEYS = [
  "siteName",
  "siteTagline",
  "defaultWhatsappNumber",
  "contactEmail",
  "twitterUrl",
  "instagramUrl",
  "telegramUrl",
  "facebookUrl",
  "defaultMetaDescription",
  "googleAnalyticsId",
  "postsPerPage",
];

async function getSettingsMap(): Promise<Record<string, string>> {
  const rows = await db.select().from(settingsTable);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// GET /api/settings
router.get("/", async (req, res) => {
  try {
    const map = await getSettingsMap();
    res.json({
      siteName: map.siteName || "scholr",
      siteTagline: map.siteTagline || "Your Next Opportunity is One Click Away",
      defaultWhatsappNumber: map.defaultWhatsappNumber || "",
      contactEmail: map.contactEmail || "",
      twitterUrl: map.twitterUrl || "",
      instagramUrl: map.instagramUrl || "",
      telegramUrl: map.telegramUrl || "",
      facebookUrl: map.facebookUrl || "",
      defaultMetaDescription: map.defaultMetaDescription || "",
      googleAnalyticsId: map.googleAnalyticsId || "",
      postsPerPage: Number(map.postsPerPage) || 24,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/settings
router.put("/", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  try {
    const updates = SETTING_KEYS.filter((k) => body[k] !== undefined).map((k) => ({
      key: k,
      value: String(body[k]),
      updatedAt: new Date(),
    }));

    for (const update of updates) {
      await db
        .insert(settingsTable)
        .values(update)
        .onConflictDoUpdate({ target: settingsTable.key, set: { value: update.value, updatedAt: update.updatedAt } });
    }

    const map = await getSettingsMap();
    res.json({
      siteName: map.siteName || "scholr",
      siteTagline: map.siteTagline || "Your Next Opportunity is One Click Away",
      defaultWhatsappNumber: map.defaultWhatsappNumber || "",
      contactEmail: map.contactEmail || "",
      twitterUrl: map.twitterUrl || "",
      instagramUrl: map.instagramUrl || "",
      telegramUrl: map.telegramUrl || "",
      facebookUrl: map.facebookUrl || "",
      defaultMetaDescription: map.defaultMetaDescription || "",
      googleAnalyticsId: map.googleAnalyticsId || "",
      postsPerPage: Number(map.postsPerPage) || 24,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
