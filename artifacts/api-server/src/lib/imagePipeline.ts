/**
 * Persists listing cover images to our own storage at ingest time so the
 * stored URL is permanent, served from our own domain, and eligible for
 * image sitemap inclusion and Google Images indexing.
 *
 * Uses Supabase Storage (the project's default backend). The bucket
 * "listing-images" must exist with public read access.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const BUCKET = "listing-images";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetches an image from a source URL and uploads it to Supabase Storage,
 * returning the permanent public URL. If the source URL is already on our
 * own domain or Supabase storage, it's returned as-is without re-uploading.
 *
 * Returns null if the fetch fails, the image is too large, or Supabase
 * credentials are not configured — callers should handle this gracefully
 * by keeping the original source URL as a fallback.
 */
export async function persistImage(
  sourceUrl: string,
  slug: string,
): Promise<string | null> {
  if (!sourceUrl || !sourceUrl.startsWith("http")) return null;

  // Already on our Supabase storage — no need to re-persist
  if (sourceUrl.includes("supabase.co/storage/v1/object/public/")) {
    return sourceUrl;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "scholr-image-pipeline/1.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_BYTES) {
      return null;
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_BYTES) return null;
    if (buffer.byteLength === 0) return null;

    // Determine file extension from content type
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : contentType.includes("gif")
          ? "gif"
          : "jpg";

    const fileName = `${slug}.${ext}`;

    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`;
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      console.error(
        `[persistImage] Upload failed for ${slug}: ${uploadRes.status} ${errText}`,
      );
      return null;
    }

    // Construct the public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;
    return publicUrl;
  } catch (err) {
    console.error(
      `[persistImage] Error persisting image for ${slug}:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

/**
 * Batch-persist images for a listing. Persists the cover image and up to
 * 5 gallery images. Returns the updated URLs (or null for any that failed,
 * so callers can keep the original URL as fallback).
 */
export async function persistListingImages(
  coverImage: string | null,
  galleryImages: string[] | null,
  slug: string,
): Promise<{
  coverImage: string | null;
  galleryImages: string[] | null;
}> {
  const persistedCover = coverImage
    ? (await persistImage(coverImage, `${slug}-cover`)) ?? coverImage
    : null;

  const persistedGallery: string[] = [];
  if (galleryImages && galleryImages.length > 0) {
    for (let i = 0; i < Math.min(galleryImages.length, 5); i++) {
      const url = galleryImages[i];
      const persisted = await persistImage(url, `${slug}-${i}`);
      persistedGallery.push(persisted ?? url);
    }
  }

  return {
    coverImage: persistedCover,
    galleryImages: persistedGallery.length > 0 ? persistedGallery : galleryImages,
  };
}
