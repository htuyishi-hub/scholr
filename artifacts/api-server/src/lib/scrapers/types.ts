/**
 * Shared types and helpers for all scraper modules.
 */

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

const TIMEOUT_MS = 15000;
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

export function extractLinks(html: string, pattern?: RegExp): { text: string; href: string }[] {
  const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const results: { text: string; href: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    if (pattern && !pattern.test(href + text)) continue;
    if (text.length > 3) results.push({ text, href });
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

export function extractDeadline(text: string): string | undefined {
  const patterns = [
    /deadline[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /by\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /closes?\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return undefined;
}

export async function fetchDetailPage(url: string): Promise<string | null> {
  if (!url) return null;
  return fetchHtml(url);
}

/**
 * Extract the main content block from a full HTML page.
 *
 * Uses a scoring system: candidates with many <p> tags (article content)
 * are preferred over those with many <a>/<div> tags (navigation/listing grids).
 * This avoids picking up the teaser grid on listing pages like "Programme A bis Z".
 */
export function extractMainContent(html: string): string {
  const candidates: string[] = [];
  const reSelectors: Array<RegExp> = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*(class|id)="[^"]*(content|article|body|main|post)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*(class|id)="[^"]*(content|article|body|main|post)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<div[^>]*(id|class)="content"[^>]*>([\s\S]*?)<\/div>/i,
  ];
  for (const re of reSelectors) {
    const m = html.match(re);
    if (m) {
      // Groups vary by regex; pick the first non-undefined capture group
      const content = m[1] || m[2] || "";
      if (content.length > 100) candidates.push(content);
    }
  }

  // Paragraph run fallback: up to 15 consecutive paragraphs (real article pages have many)
  const pRun = html.match(/(<p[\s\S]*?>[\s\S]*?<\/p>\s*){3,15}/i);
  if (pRun && pRun[0].length > 100) candidates.push(pRun[0]);

  // Score candidates: prefer those with high <p> density (real article content)
  // over listing grids (many <a>/<div> tags, few <p> tags)
  const scored = candidates.map((c) => {
    const pCount = (c.match(/<p[\s\S]*?<\/p>/gi) || []).length;
    const linkCount = (c.match(/<a[\s\S]*?<\/a>/gi) || []).length;
    const divCount = (c.match(/<div[\s\S]*?<\/div>/gi) || []).length;
    // Article content scores high; listing grids with zero <p> tags score low/negative
    const score = pCount * 10 - linkCount * 2 - divCount;
    return { content: c, score };
  });
  scored.sort((a, b) => b.score - a.score);

  if (scored.length > 0 && scored[0].score > 5) return scored[0].content;

  // Ultra fallback: any paragraph run (even just 1-2 paragraphs)
  const anyP = html.match(/(<p[\s\S]*?>[\s\S]*?<\/p>\s*){1,50}/i);
  if (anyP) return anyP[0];

  return html;
}

export function sanitizeHtml(input: string): string {
  let html = input;
  html = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, " ");
  html = html.replace(/\s+on[a-zA-Z]+\s*=\s*"[\s\S]*?"/gi, "");
  const allowed = ["p","br","strong","b","em","i","u","ul","ol","li","blockquote","h1","h2","h3","h4","h5","h6","code","pre","table","thead","tbody","tr","td","th","a","span","div"];
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

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/"/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractImages(html: string): string[] {
  const re = /<img[^>]+src="([^"]+)"[^>]*>/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const src = m[1];
    if (src) out.push(src);
  }
  return Array.from(new Set(out));
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
  const url = baseUrl.endsWith("/") ? `${baseUrl}${listingPath}` : `${baseUrl}/${listingPath}`.replace(/\/\//g, "/");
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

  if (!results.length) {
    results.push({
      source,
      sourceUrl: url,
      title: fallbackTitle,
      description: fallbackDescription,
      country: "Rwanda",
      category: fallbackCategory,
      applyLink: url,
      itemType,
      rawData: { static: true },
    });
  }

  return results;
}
