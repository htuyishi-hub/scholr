import { Router } from "express";
import path from "path";
import fs from "fs";

const router = Router();

// Simple multipart handler using express's built-in body
// Images are stored in /tmp/uploads and served statically
const UPLOAD_DIR = "/tmp/uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// POST /api/upload/image  — expects base64 JSON body for simplicity
// { file: "data:image/jpeg;base64,..." }
router.post("/image", async (req, res) => {
  const { file, filename } = req.body as { file?: string; filename?: string };

  if (!file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  try {
    const matches = file.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ error: "Invalid file format — expected base64 data URL" });
      return;
    }

    const ext = matches[1].split("/")[1] || "jpg";
    const name = `${Date.now()}-${(filename || "image").replace(/[^a-z0-9]/gi, "-")}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, name);
    fs.writeFileSync(filePath, Buffer.from(matches[2], "base64"));

    // Return a URL that can be served statically
    res.json({ url: `/api/uploads/${name}` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
