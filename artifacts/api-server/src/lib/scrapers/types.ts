/**
 * Shared types and helpers for all scraper modules.
 */
import {
  extractArticleText,
  extractImageUrls,
  htmlToText,
  ensurePlainText,
  pickCoverImage,
} from "./extract.js";

export { extractArticleText, extractImageUrls, ensurePlainText, pickCoverImage, stripNonContent, decodeEntities } from "./extract.js";

export interface ScrapedResult {
  source: string;
  sourceUrl: string;
  title: string;
  description?: string;
  content?: string;
  plainText?: string;
  images?: string[];
  coverImage?: string | null;
  deadline?: string;
  country?: string;
  category?: string;
  applyLink?: string;
  itemType: "scholarship" | "job";
  rawData?: Record<string, unknown>;
  extractionMethod?: string;
}

export type ScraperCategory =
  | "university"
  | "government"
  | "provider"
  | "aggregator"
  | "jobs"
  | "ngo"
  | "tech"
  | "fellowship"
  | "competition"
  | "research";

export interface ScraperConfig {
  name: string;
  category: ScraperCategory;
  country?: string;
  enabled: boolean;
  priority: number; // 1 (highest) to 5 (lowest)
  fn: () => Promise<ScrapedResult[]>;
}

export interface ScraperResult {
  name: string;
  count: number;
  duration: number;
  success: boolean;
  error?: string;
}

const TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 500_000; // 500KB — enough for article content, avoids OOM on huge pages

export async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ScholrBot/1.0; +https://scholr.rw)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(tid);
    if (!res.ok || !res.body) return null;

    // Stream-read only the first MAX_HTML_BYTES to avoid OOM on huge pages
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
      if (total >= MAX_HTML_BYTES) {
        reader.cancel();
        break;
      }
    }

    const decoder = new TextDecoder();
    const parts = chunks.map((c) => decoder.decode(c, { stream: true }));
    parts.push(decoder.decode()); // flush
    return parts.join("");
  } catch {
    return null;
  }
}

export function extractText(html: string, tag: string, clsPattern?: string): string[] {
  const attr = clsPattern ? `[^>]*class="[^"]*${clsPattern}[^"]*"[^>]*` : "[^>]*";
  const re = new RegExp(`<${tag}${attr}>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/&#\d+;/g, "")
      .trim();
    if (text.length > 3) results.push(text);
  }
  return results;
}

// Noise words that appear in nav/footer links but never as real opportunity titles.
const NAV_NOISE_RE =
  /^(home|about|contact|login|log in|sign in|sign up|register|privacy|terms|cookies?|copyright|menu|search|language|skip to|back to|read more|learn more|click here|more info|see all|view all|subscribe|newsletter|follow us|share|tweet|facebook|linkedin|instagram|youtube|→|«|»|›|‹|\.\.\.)$/i;

/**
 * Extract meaningful links from a page.
 *
 * Improvements over the original:
 * 1. Strip <nav>, <header>, <footer>, <aside> before scanning — avoids picking up
 *    site navigation links (the main cause of garbage results like Google's nav bar).
 * 2. Skip pseudo-hrefs (#, javascript:, mailto:).
 * 3. Raise minimum title length to 12 characters.
 * 4. Filter common navigation noise words.
 */
export function extractLinks(html: string, pattern?: RegExp): { text: string; href: string }[] {
  // Remove structural chrome — nav bars, headers, footers, sidebars.
  // Using non-greedy match; works well for non-deeply-nested elements.
  const cleaned = html
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "");

  const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const results: { text: string; href: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    const href = m[1];
    // Skip pseudo-links and anchors
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) continue;
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    // Require a meaningful title — navigation labels tend to be very short
    if (text.length < 12) continue;
    // Skip obvious nav noise words
    if (NAV_NOISE_RE.test(text)) continue;
    if (pattern && !pattern.test(href + text)) continue;
    results.push({ text, href });
  }
  return results;
}

export function absoluteUrl(base: string, path: string): string {
  if (!path) return base;
  if (path.startsWith("http")) return path;
  try {
    return new URL(path, base).href;
  } catch {
    return base;
  }
}

// ── Deadline extraction helpers ───────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8,
  sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function monthNum(s: string): number | undefined {
  return MONTH_MAP[s.toLowerCase()];
}

function toIso(year: number, month: number, day?: number): string {
  const y = String(year).padStart(4, "0");
  const mo = String(month).padStart(2, "0");
  return day === undefined
    ? `${y}-${mo}`
    : `${y}-${mo}-${String(day).padStart(2, "0")}`;
}

/**
 * Parse a date phrase (stripped of ordinal suffixes and extra commas) into ISO.
 * Handles "Month DD YYYY" and "DD Month YYYY".
 */
function parseDatePhrase(raw: string): string | undefined {
  const s = raw
    .replace(/\b(?:st|nd|rd|th)\b/gi, "")
    .replace(/[,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // "October 31 2025"
  let m = s.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/);
  if (m) { const mo = monthNum(m[1]); if (mo) return toIso(+m[3], mo, +m[2]); }
  // "31 October 2025"
  m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (m) { const mo = monthNum(m[2]); if (mo) return toIso(+m[3], mo, +m[1]); }
  return undefined;
}

// Shared regex fragments
const MONTH_RE =
  "(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)";
const ORD_RE = "(?:st|nd|rd|th)?";
const SEP_RE = "[\\s,]+";

// Keyword anchor: deadline / due date / closing date / apply by / etc.
const KW_RE =
  "(?:application\\s+)?(?:deadline|due(?:\\s+date)?|clos(?:es?|ing)(?:\\s+date)?|appli(?:cation|cations)?\\s+(?:deadline|due|close[sd]?)|submit(?:ted)?(?:\\s+by)?|open(?:s|ed)?\\s+until|apply\\s+by|applications\\s+(?:by|until|open\\s+until)|until)";

/**
 * Extract a deadline date from plain text and return it normalised to ISO 8601
 * (YYYY-MM-DD or YYYY-MM).  Returns "Rolling" for open/rolling deadlines.
 * Returns undefined when no date is found.
 *
 * Priority order:
 *  0. Rolling / no fixed deadline
 *  1. ISO 8601  (2025-10-31)
 *  2. Keyword-anchored written month  (Deadline: 31 October 2025)
 *  3. Keyword-anchored numeric  (Due date: 31/10/2025)
 *  4. "by / before / until DATE"
 *  5. Bare written date  (31 October 2025 / October 31, 2025)
 *  6. Numeric DD/MM/YYYY or MM/DD/YYYY
 *  7. Month + year only  (October 2025)
 */
export function extractDeadline(text: string): string | undefined {
  if (!text) return undefined;

  // ── 0. Rolling / open ────────────────────────────────────────────────────
  if (
    /rolling\s+(?:deadline|basis|admission)/i.test(text) ||
    /open\s+until\s+further\s+notice/i.test(text) ||
    /no\s+(?:fixed\s+)?deadline/i.test(text)
  ) {
    return "Rolling";
  }

  // ── 1. ISO 8601 ───────────────────────────────────────────────────────────
  {
    const m = text.match(/\b(\d{4})[-\/](\d{2})[-\/](\d{2})\b/);
    if (m) return toIso(+m[1], +m[2], +m[3]);
  }

  // ── 2 & 3. Keyword-anchored ───────────────────────────────────────────────
  const kwAnchoredPatterns: RegExp[] = [
    // keyword: DD Month YYYY  or  Month DD, YYYY
    new RegExp(`${KW_RE}[:\\s]+(\\d{1,2}${ORD_RE}${SEP_RE}${MONTH_RE}${SEP_RE}\\d{4})`, "i"),
    new RegExp(`${KW_RE}[:\\s]+(${MONTH_RE}${SEP_RE}\\d{1,2}${ORD_RE}${SEP_RE}\\d{4})`, "i"),
    // keyword: DD/MM/YYYY or DD-MM-YYYY
    new RegExp(`${KW_RE}[:\\s]+(\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{2,4})`, "i"),
  ];
  for (const re of kwAnchoredPatterns) {
    const m = text.match(re);
    if (m) {
      // Try written-month parse first, fall back to numeric
      const parsed = parseDatePhrase(m[1]);
      if (parsed) return parsed;
      // Numeric fallback: DD/MM/YYYY
      const nm = m[1].match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (nm) {
        let year = +nm[3];
        if (year < 100) year += 2000;
        const day = +nm[1], mo = +nm[2];
        if (day >= 1 && day <= 31 && mo >= 1 && mo <= 12) return toIso(year, mo, day);
      }
    }
  }

  // ── 4. "by / before / until DATE" ────────────────────────────────────────
  const byPatterns: RegExp[] = [
    new RegExp(`\\bby${SEP_RE}(\\d{1,2}${ORD_RE}${SEP_RE}${MONTH_RE}${SEP_RE}\\d{4})`, "i"),
    new RegExp(`\\bby${SEP_RE}(${MONTH_RE}${SEP_RE}\\d{1,2}${ORD_RE}${SEP_RE}\\d{4})`, "i"),
    new RegExp(`\\b(?:before|until)${SEP_RE}(\\d{1,2}${ORD_RE}${SEP_RE}${MONTH_RE}${SEP_RE}\\d{4})`, "i"),
    new RegExp(`\\b(?:before|until)${SEP_RE}(${MONTH_RE}${SEP_RE}\\d{1,2}${ORD_RE}${SEP_RE}\\d{4})`, "i"),
  ];
  for (const re of byPatterns) {
    const m = text.match(re);
    if (m) { const parsed = parseDatePhrase(m[1]); if (parsed) return parsed; }
  }

  // ── 5. Bare written date ─────────────────────────────────────────────────
  const barePatterns: RegExp[] = [
    new RegExp(`\\b(\\d{1,2}${ORD_RE}${SEP_RE}${MONTH_RE}${SEP_RE}\\d{4})\\b`, "i"),
    new RegExp(`\\b(${MONTH_RE}${SEP_RE}\\d{1,2}${ORD_RE}${SEP_RE}\\d{4})\\b`, "i"),
  ];
  for (const re of barePatterns) {
    const m = text.match(re);
    if (m) { const parsed = parseDatePhrase(m[1]); if (parsed) return parsed; }
  }

  // ── 6. Numeric DD/MM/YYYY ────────────────────────────────────────────────
  {
    const m = text.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
    if (m) {
      let year = +m[3];
      if (year < 100) year += 2000;
      const nowYear = new Date().getFullYear();
      if (year >= nowYear) {
        const day = +m[1], mo = +m[2];
        if (day >= 1 && day <= 31 && mo >= 1 && mo <= 12) return toIso(year, mo, day);
      }
    }
  }

  // ── 7. Month + year only ─────────────────────────────────────────────────
  {
    const m = text.match(new RegExp(`\\b(${MONTH_RE})\\s+(\\d{4})\\b`, "i"));
    if (m) {
      const mo = monthNum(m[1]);
      const year = +m[2];
      if (mo && year >= new Date().getFullYear()) return toIso(year, mo);
    }
  }

  return undefined;
}

export async function fetchDetailPage(url: string): Promise<string | null> {
  if (!url) return null;
  return fetchHtml(url);
}

/**
 * Detect if a HTML page is a JS-rendered SPA shell (Vue, React, Angular) where
 * the actual content is loaded client-side. These pages contain placeholder
 * elements with messages like "This content has not yet been loaded" and
 * framework-specific data- attributes.
 */
export function isSpaPlaceholderPage(html: string): boolean {
  const spaIndicators: RegExp[] = [
    /data-v-[a-f0-9]+/i,
    /data-reactroot/i,
    /data-reactid/i,
    /ng-version/i,
    /qa-module-placeholder/i,
    /data-print-placeholder/i,
    /content has not yet been loaded/i,
    /placeholder@print/i,
    /u-placeholder@print/i,
    /loading-text\s+pulse-opacity-animation/i,
  ];
  let matchCount = 0;
  for (const pattern of spaIndicators) {
    if (pattern.test(html)) matchCount++;
  }
  return matchCount >= 3;
}

/**
 * Detect if a HTML page is a listing/overview page rather than a single detail page.
 * Listing pages contain grids of teaser cards with many links and repeating patterns.
 */
export function isListingPage(html: string): boolean {
  const listingIndicators: RegExp[] = [
    /overview__grid/i,
    /grid--33-33-33/i,
    /teaser__headline/i,
    /teaser__image/i,
    /teaser__content-wrap/i,
    /Programme\s+A\s+bis\s+Z/i,
    /overview__sort/i,
    /listing-page/i,
    /class="[^"]*overview[^"]*"/i,
    /class="[^"]*teaser[^"]*"/i,
    /class="[^"]*listing[^"]*"/i,
  ];
  let matchCount = 0;
  for (const pattern of listingIndicators) {
    if (pattern.test(html)) matchCount++;
  }
  return matchCount >= 3;
}

/**
 * Extract text from SPA placeholder pages that have server-rendered text
 * hidden in utility classes like u-visibility-hidden or js-dynamic-content.
 * Also harvests OG meta tags for images and descriptions.
 *
 * Returns fallback content: description, plainText, images, coverImage.
 */
export function extractSpaFallback(html: string, baseUrl?: string): {
  content: string;
  plainText: string;
  images: string[];
  coverImage: string | null;
} {
  const result: {
    content: string;
    plainText: string;
    images: string[];
    coverImage: string | null;
  } = {
    content: "",
    plainText: "",
    images: [],
    coverImage: null,
  };

  // 1. Collect visible text from js-dynamic-content / u-visibility-hidden spans.
  //    These contain real article text but are visually hidden until Vue hydrates.
  const hiddenTexts: string[] = [];
  const dynamicRe = /<span[^>]*class="[^"]*js-dynamic-content[^"]*"[^>]*>[\s\S]*?<\/span>/gi;
  let dm: RegExpExecArray | null;
  while ((dm = dynamicRe.exec(html)) !== null) {
    const inner = dm[0].replace(/<[^>]+>/g, "").trim();
    if (inner && inner.length > 5) hiddenTexts.push(inner);
  }

  if (hiddenTexts.length > 0) {
    const combined = hiddenTexts.join("\n\n");
    result.plainText = combined;
    result.content = combined;
  }

  // 2. Harvest OG meta tags
  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"[^>]*>/i);
  const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"[^>]*>/i);
  const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"[^>]*>/i);

  if (ogTitle && ogTitle[1].trim()) {
    const titleText = ogTitle[1].trim();
    if (result.plainText && !result.plainText.includes(titleText)) {
      result.plainText = titleText + "\n\n" + result.plainText;
      result.content = titleText + "\n\n" + result.content;
    } else if (!result.plainText) {
      result.plainText = titleText;
      result.content = titleText;
    }
  }

  if (ogDesc && ogDesc[1].trim().length > 10) {
    const descText = ogDesc[1].trim();
    if (result.plainText && !result.plainText.includes(descText)) {
      result.plainText += "\n\n" + descText;
      result.content += "\n\n" + descText;
    } else if (!result.plainText) {
      result.plainText = descText;
      result.content = descText;
    }
  }

  if (ogImage && ogImage[1].trim().length > 10) {
    const imgSrc = ogImage[1].trim();
    const abs = baseUrl ? extractImageUrls(`<meta property="og:image" content="${imgSrc}">`, baseUrl)[0] : imgSrc;
    if (abs) {
      result.images.push(abs);
      result.coverImage = abs;
    }
  }

  // 3. Also harvest images from <noscript> fallback and lazy attrs
  const spaImages = extractImages(html, baseUrl);
  for (const img of spaImages) {
    if (!result.images.includes(img)) {
      result.images.push(img);
    }
  }
  if (!result.coverImage && result.images.length > 0) {
    result.coverImage = result.images[0];
  }

  // 4. Try to extract visible headings (<h1>-<h3>) for extra content
  const headingRe = /<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/gi;
  let hm: RegExpExecArray | null;
  const headings: string[] = [];
  while ((hm = headingRe.exec(html)) !== null) {
    const text = htmlToText(hm[0]);
    if (text.length > 3) headings.push(text);
  }
  if (headings.length > 0) {
    const headingText = headings.slice(0, 3).join("\n");
    if (!result.plainText.includes(headingText.slice(0, 30))) {
      result.plainText = headingText + "\n\n" + result.plainText;
      result.content = headingText + "\n\n" + result.content;
    }
  }

  return result;
}

/**
 * Strip Elementor/WordPress page-builder scaffolding from HTML.
 *
 * Elementor wraps every piece of content in deeply nested divs with
 * class="elementor-element elementor-element-XXXXXXXX ..." and inline
 * data-settings="{...JSON...}" attributes. This strips those wrappers
 * so downstream selectors can find real content blocks.
 */
function stripPageBuilderScaffolding(html: string): string {
  // Remove Elementor data-settings / data-e-type / data-id attributes
  // (they carry large JSON blobs that pollute plain-text extraction)
  let out = html.replace(/\s+data-(?:settings|id|e-type|element_type|widget_type)="[^"]*"/gi, "");
  // Strip MS Word / Office Online span annotation attributes
  out = out.replace(/\s+data-ccp-(?:charstyle|props|parastyle)[^"]*"[^"]*"/gi, "");
  out = out.replace(/\s+data-contrast="[^"]*"/gi, "");
  return out;
}

/**
 * Extract the main content block from a full HTML page as clean plain text.
 *
 * Strategy (in priority order):
 * 1. Semantic HTML5 elements: <article>, <main>
 * 2. Common CMS content wrappers by class/id keyword
 * 3. Elementor / page-builder content widgets (.heading-description, .entry-content, etc.)
 * 4. Paragraph-run fallback
 *
 * Returns plain text (not HTML). Returns empty string when the page is a
 * listing/overview page or an unrendered SPA shell.
 */
export function extractMainContent(html: string): string {
  if (isListingPage(html)) return "";
  if (isSpaPlaceholderPage(html)) return "";
  return extractArticleText(html);
}

export function sanitizeHtml(input: string): string {
  let html = input;
  html = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, " ");
  html = html.replace(/\s+on[a-zA-Z]+\s*=\s*"[\s\S]*?"/gi, "");
  const allowed = ["img", "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "code", "pre", "table", "thead", "tbody", "tr", "td", "th", "a", "span", "div"];
  html = html.replace(/<\/?([a-zA-Z0-9:-]+)(\s[^>]*)?>/g, (match, tag) => {
    const t = String(tag).toLowerCase();
    if (!allowed.includes(t)) return " ";
    return match;
  });
  html = html.replace(/<(a)(\s+[^>]*)?>/gi, (m) => {
    const hrefMatch = m.match(/href\s*=\s*"([^"]*)"/i);
    const href = hrefMatch?.[1];
    if (!href) return "<a>";
    return `<a href="${href.replace(/"/g, "")}">`;
  });
  html = html.replace(/&nbsp;/gi, " ").trim();
  return html.replace(/\s+/g, " ");
}

/**
 * Convert HTML to clean, readable plain text.
 *
 * Key improvements over the old version:
 * - Inserts newlines at block-element boundaries so paragraphs don't run together.
 * - Decodes all common HTML entities (including &quot;, &#160;, &#NNN;, &apos;).
 * - Strips Elementor/Word-Online JSON blobs that leak into text via data-* attrs
 *   (those attrs are inside tags and removed by the tag-strip, but this ensures
 *   any leftover entity-encoded JSON is cleaned up too).
 * - Collapses whitespace while preserving meaningful paragraph breaks.
 */
export function htmlToPlainText(html: string): string {
  return ensurePlainText(html);
}

/**
 * Extract image URLs from HTML.
 * Handles standard <img src>, lazy-loaded data-src/data-lazy-src/data-original,
 * <noscript> fallback images, and CSS background-image URLs.
 */
export function extractImages(html: string, baseUrl?: string): string[] {
  return extractImageUrls(html, baseUrl);
}

export function makeDescriptionFromText(plainText: string, maxChars = 220): string {
  const cleaned = plainText.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxChars) return cleaned;
  return cleaned.slice(0, maxChars).replace(/\s+\S*$/, "").trim() + "\u2026";
}

/**
 * Generic scraper factory: given a source config, scrapes links from listing page
 * that match a keyword pattern, with fallback static result.
 */
export async function scrapeGenericList(
  source: string,
  baseUrl: string,
  listingPath: string,
  keywordPattern: RegExp,
  maxLinks: number,
  itemType: "scholarship" | "job",
  fallbackTitle: string,
  fallbackDescription: string,
  fallbackCategory: string,
): Promise<ScrapedResult[]> {
  const url = baseUrl.endsWith("/") ? baseUrl + listingPath : baseUrl + "/" + listingPath.replace(/\/\//g, "/");
  const html = await fetchHtml(url);
  const results: ScrapedResult[] = [];

  if (html) {
    const links = extractLinks(html, keywordPattern);
    for (const link of links.slice(0, maxLinks)) {
      if (link.text.length < 10) continue;
      results.push({
        source,
        sourceUrl: absoluteUrl(baseUrl, link.href),
        title: link.text,
        description: fallbackDescription,
        country: "Rwanda",
        category: fallbackCategory,
        applyLink: absoluteUrl(baseUrl, link.href),
        itemType,
        rawData: { href: link.href },
      });
    }
  }

  // No static fallback — return empty rather than a phantom homepage link.
  return results;
}
