import { Router } from "express";
import { getUserIdFromToken } from "../lib/auth.js";

const router = Router();

async function getAdminId(req: import("express").Request): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  return (await getUserIdFromToken(token)) ?? null;
}

// POST /api/ai/generate-description
router.post("/generate-description", async (req, res) => {
  const adminId = await getAdminId(req);
  if (!adminId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { title, category, country, fundingType } = req.body as Record<string, string>;
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "AI service not configured" });
    return;
  }

  try {
    const prompt = `You are a scholarship editor for a platform called Scholr. Generate content for the following opportunity:

Title: ${title}
Category: ${category || "Scholarship"}
Country: ${country || "International"}
Funding Type: ${fundingType === "full" ? "Fully Funded" : fundingType === "partial" ? "Partially Funded" : "Free Entry"}

Please respond with ONLY valid JSON in this exact format:
{
  "description": "A compelling 2-sentence teaser for the card (max 180 characters total). Focus on the key benefit and who it's for.",
  "tags": ["tag1", "tag2", "tag3"]
}

For tags, choose 2-4 relevant tags from: STEM, Arts, Medicine, Business, Law, Engineering, Social Sciences, Africa Focus, Women Only, Open to All, Highly Competitive, No Essay Required, Fully Funded, Leadership, Research, Government, Private, Merit-Based, Need-Based`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      req.log.error({ status: response.status }, "Anthropic API error");
      res.status(502).json({ error: "AI service returned an error" });
      return;
    }

    const data = await response.json() as { content: Array<{ type: string; text: string }> };
    const text = data.content[0]?.text || "{}";

    let parsed: { description: string; tags: string[] };
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      res.status(502).json({ error: "Could not parse AI response" });
      return;
    }

    res.json({ description: parsed.description || "", tags: parsed.tags || [] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
