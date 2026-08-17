import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { objectStorageClient, ObjectStorageService } from "../lib/objectStorage.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

const storageService = new ObjectStorageService();

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  const cleaned = path.replace(/^\//, "");
  const parts = cleaned.split("/");
  return { bucketName: parts[0], objectName: parts.slice(1).join("/") };
}

// POST /api/upload/image
// Accepts multipart/form-data with field name "image"
// Uploads to Replit Object Storage (persistent) and returns a serving URL
router.post(
  "/image",
  upload.single("image"),
  async (req, res) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    try {
      let privateDir: string;
      try {
        privateDir = storageService.getPrivateObjectDir();
      } catch {
        // Object Storage not yet configured — fall back to a descriptive error
        res.status(503).json({
          error:
            "Object Storage not configured. Set PRIVATE_OBJECT_DIR and DEFAULT_OBJECT_STORAGE_BUCKET_ID environment variables.",
        });
        return;
      }

      const ext = (file.mimetype.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const filename = `${randomUUID()}.${ext}`;
      const objectKey = `images/${filename}`;

      // Build the full GCS path: privateDir/images/<uuid>.<ext>
      const dir = privateDir.endsWith("/") ? privateDir : `${privateDir}/`;
      const fullPath = `${dir}${objectKey}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);

      const bucket = objectStorageClient.bucket(bucketName);
      const gcsFile = bucket.file(objectName);

      await gcsFile.save(file.buffer, {
        contentType: file.mimetype,
        resumable: false,
      });

      // Served by existing GET /api/storage/objects/* route
      res.json({ url: `/api/storage/objects/${objectKey}` });
    } catch (err) {
      req.log.error(err, "Image upload failed");
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default router;
