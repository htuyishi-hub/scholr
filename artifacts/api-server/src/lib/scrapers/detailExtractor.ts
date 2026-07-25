/**
 * Detail page extractor.
 *
 * Fetches each scraped item's detail page URL and extracts
 * rich content: HTML body, plain text, images, cover image, deadline.
 *
 * Called after deduplication so we only fetch detail pages for items
 * that will actually be inserted.
 *
 * Fault-tolerant: if extraction fails, the original item is kept.
 * Listing/overview pages (detected by isListingPage) are skipped
 * to preserve original scrape data.
 * SPA placeholder pages (Vue/React/Angular) fall back to extracting
 * server-rendered hidden text, OG meta tags, and images.
 */
import type { ScrapedResult } from "./types.js";
import {
  fetchHtml,
  extractMainContent,
  extractSpaFallback,
  isSpaPlaceholderPage,
  extractImages,
  extractDeadline,
  makeDescriptionFromText,
} from "./types.js";

/**
 * Extract rich content from a single detail page URL.
 * Returns partial data — the caller merges with the original item.
 *
 * Strategy (tries in order):
 * 1. sourceUrl — the listing/article page (contains full description, images).
 * 2. applyLink — fallback for sites where the article page is sparse but the
 *    application portal has useful details.
 */
export async function extractDetailPage(item: ScrapedResult): Promise<Partial<ScrapedResult>> {
  const urlsToTry = [item.sourceUrl];
  if (item.applyLink && item.applyLink !== item.sourceUrl) {
    urlsToTry.push(item.applyLink);
  }

  const validUrls = urlsToTry.filter(Boolean) as string[];
  if (validUrls.length === 0) {
    return {};
  }

  for (const url of validUrls) {
    try {
      const html = await fetchHtml(url);
      if (!html) continue;

      // extractMainContent now returns clean plain text (not HTML).
      // It strips page-builder scaffolding, decodes entities, and normalises
      // whitespace before returning.  An empty return means listing/SPA page.
      const plainText = extractMainContent(html);

      if (!plainText) {
        // SPA fallback: harvest OG meta + server-rendered hidden text
        if (isSpaPlaceholderPage(html)) {
          const spaFallback = extractSpaFallback(html);
          if (spaFallback.plainText.length > 50) {
            const extra: Partial<ScrapedResult> = {
              content: spaFallback.plainText,
              plainText: spaFallback.plainText,
              description: makeDescriptionFromText(spaFallback.plainText, 220),
            };
            if (spaFallback.images.length > 0) {
              extra.images = spaFallback.images;
              extra.coverImage = spaFallback.coverImage || spaFallback.images[0];
            }
            const dl = extractDeadline(spaFallback.plainText);
            if (dl) extra.deadline = dl;
            return extra;
          }
        }
        continue;
      }

      // Require a minimum amount of useful text
      if (plainText.length < 80) continue;

      const extra: Partial<ScrapedResult> = {
        // Store clean plain text in both fields so the editorial UI always
        // shows readable content, never raw HTML markup.
        content: plainText,
        plainText,
        description: makeDescriptionFromText(plainText, 220),
      };

      // Extract cover image from the raw HTML (separate from text content)
      const images = extractImages(html);
      if (images.length > 0) {
        extra.images = images;
        extra.coverImage = images[0];
      }

      const dl = extractDeadline(plainText);
      if (dl) extra.deadline = dl;

      return extra;
    } catch {
      // Try next URL
      continue;
    }
  }

  // All URLs failed or produced no content
  return {};
}

/**
 * Enrich a batch of scraped results with detail-page content.
 * Deduplicates by URL to avoid redundant fetches.
 * Concurrency-limited via the provided limiter.
 */
export async function enrichResults(
  items: ScrapedResult[],
  limitFn: <T>(fn: () => Promise<T>) => Promise<T>,
): Promise<ScrapedResult[]> {
  const cache = new Map<string, Partial<ScrapedResult>>();

  const tasks = items.map((item) => {
    // Use sourceUrl as the cache key since that's the article/detail page URL
    const url = item.sourceUrl || item.applyLink;
    return limitFn(async () => {
      // Skip static/fallback items — they have no real detail page to fetch
      if (item.rawData?.static === true) {
        return item;
      }

      // Use cached result if we've already fetched this URL
      if (url && cache.has(url)) {
        const enriched = cache.get(url)!;
        return {
          ...item,
          ...enriched,
          images: enriched.images?.length ? enriched.images : (item.images ?? []),
        };
      }

      const enriched = await extractDetailPage(item);
      if (url) cache.set(url, enriched);

      return {
        ...item,
        ...enriched,
        images: enriched.images?.length ? enriched.images : (item.images ?? []),
      };
    });
  });

  return Promise.all(tasks);
}
