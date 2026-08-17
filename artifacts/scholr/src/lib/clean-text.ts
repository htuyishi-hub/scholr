/**
 * Browser-side helpers for the editorial workspace.
 *
 * `htmlToReadableText` mirrors the server-side extractor: it turns any HTML
 * that still lives in a scraped record into clean, paragraph-separated text an
 * editor can actually re-write.
 */
export function htmlToReadableText(input: string): string {
  if (!input) return "";
  if (!/<[a-z!/][^>]*>/i.test(input)) return input.trim();

  const withBreaks = input
    .replace(/<(?:script|style|noscript)[\s\S]*?<\/(?:script|style|noscript)>/gi, " ")
    .replace(/<\/(?:p|div|section|article|h[1-6]|li|tr|blockquote|figcaption)\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n• ");

  const doc = new DOMParser().parseFromString(withBreaks, "text/html");
  const text = doc.body.textContent ?? "";

  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n\n");
}

/** True when a string still contains HTML markup. */
export function looksLikeHtml(value: string | null | undefined): boolean {
  return !!value && /<(?:p|div|span|br|img|h[1-6]|ul|ol|li|table|a)\b[^>]*>/i.test(value);
}

const IMAGE_URL_RE = /^https?:\/\/\S+$/i;

/**
 * Parse a pasted blob (one or many URLs, separated by newlines, commas or
 * spaces) into a clean list of usable, absolute image URLs.
 *
 * Any public image on the internet can be referenced this way — nothing is
 * downloaded or stored, only the link is kept, which keeps the database small.
 */
export function parseImageUrls(input: string): { valid: string[]; invalid: string[] } {
  const tokens = input
    .split(/[\s,]+/)
    .map((t) => t.trim().replace(/^["'<(]+|[)"'>]+$/g, ""))
    .filter(Boolean);

  const valid: string[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    if (!IMAGE_URL_RE.test(token)) {
      invalid.push(token);
      continue;
    }
    try {
      valid.push(new URL(token).href);
    } catch {
      invalid.push(token);
    }
  }
  return { valid, invalid };
}
