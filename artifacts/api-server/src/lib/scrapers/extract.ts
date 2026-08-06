/**
 * Content extraction utilities.
 *
 * Goal: turn a raw HTML page into (a) clean, readable, editor-friendly text and
 * (b) a list of real, absolute, usable image URLs.
 *
 * Everything here is dependency-free (no jsdom/cheerio) so it runs fast inside
 * the API server, but it is far more careful than naive regex stripping:
 *
 *  - Non-content elements (script/style/nav/header/footer/aside/forms, cookie
 *    banners, share widgets, related-posts blocks…) are removed with a
 *    nesting-aware element remover before any text is read.
 *  - The main article block is chosen by scoring candidate containers on text
 *    volume, paragraph count and link density instead of taking the first
 *    regex match (which used to cut off at the first `</div>`).
 *  - Text is emitted as clean paragraphs: entities decoded, boilerplate lines
 *    dropped, duplicates collapsed. No tags, no JSON blobs, no CSS.
 *  - Images are absolutised against the page URL, resolved from src / lazy
 *    attributes / srcset (largest candidate) / og:image / background-image,
 *    and filtered so logos, icons, sprites, avatars and tracking pixels never
 *    reach the editorial gallery.
 */

// ── low level HTML helpers ────────────────────────────────────────────────────

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "param", "source", "track", "wbr",
]);

/** Find the index just after the element that starts at `openIdx`. */
function endOfElement(html: string, openIdx: number, tag: string): number {
  const lower = html.toLowerCase();
  if (VOID_TAGS.has(tag)) {
    const gt = html.indexOf(">", openIdx);
    return gt === -1 ? html.length : gt + 1;
  }
  const openRe = new RegExp(`<${tag}(?=[\\s/>])`, "gi");
  const closeRe = new RegExp(`</${tag}\\s*>`, "gi");
  let depth = 0;
  let cursor = openIdx + tag.length + 1;
  // Walk forward alternating between the next open and next close tag.
  for (;;) {
    openRe.lastIndex = cursor;
    closeRe.lastIndex = cursor;
    const nextOpen = openRe.exec(lower);
    const nextClose = closeRe.exec(lower);
    if (!nextClose) return html.length;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      cursor = nextOpen.index + tag.length + 1;
      continue;
    }
    if (depth === 0) return nextClose.index + nextClose[0].length;
    depth--;
    cursor = nextClose.index + nextClose[0].length;
  }
}

/** Remove every `<tag …>…</tag>` element (nesting aware). */
function removeTags(html: string, tags: string[]): string {
  let out = html;
  for (const tag of tags) {
    const re = new RegExp(`<${tag}(?=[\\s/>])`, "i");
    for (let guard = 0; guard < 500; guard++) {
      const m = re.exec(out);
      if (!m) break;
      const end = endOfElement(out, m.index, tag);
      out = out.slice(0, m.index) + " " + out.slice(end);
    }
  }
  return out;
}

/**
 * Remove elements whose class/id/role marks them as chrome.
 *
 * Two tiers, because page builders (Elementor, tagDiv…) reuse generic words
 * like "widget" for real article content:
 *  - hard noise  → always removed (nav, footer, cookie bar, comments…)
 *  - soft noise  → removed only when the block is text-poor (a real article
 *    body is never dropped just because its wrapper is called "widget").
 */
function removeNoisyElements(html: string): string {
  let out = html;
  const openRe = /<(div|section|ul|ol|aside|nav|table|form)\b[^>]*>/gi;
  for (let guard = 0; guard < 400; guard++) {
    openRe.lastIndex = 0;
    let removed = false;
    let m: RegExpExecArray | null;
    while ((m = openRe.exec(out)) !== null) {
      const attrs = m[0];
      const idClass = (attrs.match(/(?:class|id|role|data-testid)="([^"]*)"/gi) ?? []).join(" ");
      if (!idClass) continue;
      const hard = HARD_NOISE_RE.test(idClass);
      const soft = !hard && SOFT_NOISE_RE.test(idClass);
      if (!hard && !soft) continue;
      const tag = m[1]!.toLowerCase();
      const end = endOfElement(out, m.index, tag);
      const block = out.slice(m.index, end);
      // Never nuke the whole page.
      if (end - m.index > out.length * 0.6) continue;
      if (soft) {
        const paragraphs = (block.match(/<p\b/gi) ?? []).length;
        const textLen = block.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
        if (paragraphs >= 2 || textLen > 600) continue; // real content, keep it
      }
      out = out.slice(0, m.index) + " " + out.slice(end);
      removed = true;
      break;
    }
    if (!removed) break;
  }
  return out;
}

const HARD_NOISE_RE =
  /(?:^|[\s"'_-])(?:nav|navbar|navigation|menu|breadcrumbs?|sidebar|side-bar|footer|header|masthead|cookie|consent|gdpr|promo|advert|ads?|adsbygoogle|sponsor|social|share|sharing|follow|subscribe|newsletter|signup|comments?|disqus|pagination|pager|searchform|skip-?link|offcanvas|modal|popup|toolbar|language-switch)(?:[\s"'_-]|$)/i;

const SOFT_NOISE_RE =
  /(?:^|[\s"'_-])(?:related|recommended|more-?stories|popular|trending|tags?-list|author-box|meta|banner|widget-area)(?:[\s"'_-]|$)/i;

/** Strip everything that is never article content. */
export function stripNonContent(html: string): string {
  let out = removeTags(html, [
    "script", "style", "noscript", "svg", "iframe", "form", "template",
    "nav", "header", "footer", "aside", "select", "button",
  ]);
  out = out.replace(/<!--[\s\S]*?-->/g, " ");
  out = out.replace(/\s+data-(?:settings|id|e-type|element_type|widget_type|contrast|ccp-[a-z]+)="[^"]*"/gi, "");
  out = removeNoisyElements(out);
  return out;
}

// ── entities & text ───────────────────────────────────────────────────────────

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", rsquo: "\u2019",
  lsquo: "\u2018", ldquo: "\u201c", rdquo: "\u201d", mdash: "\u2014",
  ndash: "\u2013", hellip: "\u2026", eacute: "é", egrave: "è", agrave: "à",
  ccedil: "ç", uuml: "ü", ouml: "ö", auml: "ä", deg: "°", euro: "€",
  pound: "£", trade: "™", copy: "©", reg: "®", middot: "·", bull: "•",
  laquo: "«", raquo: "»", times: "×", frac12: "½", shy: "",
};

export function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChar(Number(d)))
    .replace(/&([a-z][a-z0-9]{1,10});/gi, (m, name) => {
      const key = String(name).toLowerCase();
      return key in NAMED_ENTITIES ? NAMED_ENTITIES[key] : m;
    });
}

function safeChar(code: number): string {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

/** Lines that are navigation/legal chrome rather than opportunity content. */
const BOILERPLATE_LINE_RE =
  /^(?:home|menu|search|share|tweet|print|back|next|previous|close|cookies?|accept(?: all)?(?: cookies)?|manage (?:cookies|preferences)|privacy(?: policy)?|terms(?: (?:of use|and conditions))?|imprint|sitemap|newsletter|subscribe|follow us|contact(?: us)?|log ?in|sign ?in|sign ?up|register|read more|learn more|show more|view all|see all|apply now|skip to (?:main )?content|toggle navigation|©.*|all rights reserved.*|\d{1,3}%?|[|·•>»‹›\-–—\s]*)$/i;

const COOKIE_LINE_RE =
  /(?:we use cookies|uses cookies|cookie (?:policy|settings|preferences)|by clicking any link|consent for us to set cookies|enhance your (?:user )?experience|accept (?:all )?cookies)/i;

const JUNK_LINE_RE = /^(?:\{|\[|\.|#|@media|function\s|var\s|window\.|document\.)/;

function isUsefulLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (t.length < 2) return false;
  if (BOILERPLATE_LINE_RE.test(t)) return false;
  if (JUNK_LINE_RE.test(t)) return false;
  if (COOKIE_LINE_RE.test(t)) return false;
  // Menus rendered as "A | B | C | D"
  if ((t.match(/\|/g)?.length ?? 0) >= 3) return false;
  // Lines that are almost only punctuation/symbols
  const letters = t.replace(/[^a-zA-Z\u00C0-\u024F]/g, "").length;
  if (letters < Math.max(2, t.length * 0.35)) return false;
  return true;
}

/** Convert an HTML fragment to clean, paragraph-separated plain text. */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\/(?:p|div|section|article|h[1-6]|li|tr|blockquote|dd|dt|figcaption)\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:td|th)\s*>/gi, " ")
    .replace(/<li\b[^>]*>/gi, "\n• ")
    .replace(/<h([1-6])\b[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");

  const decoded = decodeEntities(withBreaks)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t\f\v]+/g, " ");

  const lines = decoded.split("\n").map((l) => l.trim());

  const kept: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    if (!isUsefulLine(line)) continue;
    const key = line.toLowerCase().replace(/[^a-z0-9]/g, "");
    // Collapse duplicated blocks (common in headers repeated per breakpoint)
    if (key.length > 12 && seen.has(key)) continue;
    seen.add(key);
    kept.push(line);
  }

  return kept.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ── main content selection ────────────────────────────────────────────────────

const CONTENT_HINT_RE =
  /(entry-content|post-content|article-body|articlebody|story-body|page-content|single-content|main-content|content-area|rich-?text|prose|wysiwyg|elementor-widget-container|field--name-body|node__content|scholarship|opportunity|vacancy|job-description)/i;

function textStats(fragment: string): { text: string; score: number } {
  const text = htmlToText(fragment);
  if (!text) return { text: "", score: 0 };
  const paragraphs = (fragment.match(/<p\b/gi)?.length ?? 0) + (fragment.match(/<li\b/gi)?.length ?? 0) / 3;
  const anchors: string[] = fragment.match(/<a\b[\s\S]*?<\/a>/gi) ?? [];
  const linkText = anchors.reduce((n, a) => n + htmlToText(a).length, 0);
  const linkDensity = text.length > 0 ? Math.min(1, linkText / text.length) : 1;
  const score = text.length * (1 - linkDensity * 0.9) + paragraphs * 40;
  return { text, score };
}

/**
 * Extract the main readable content of a page as clean plain text.
 * Returns "" when nothing article-like could be found.
 */
export function extractArticleText(html: string): string {
  const cleaned = stripNonContent(html);
  const body = cleaned.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? cleaned;

  const candidates: { text: string; score: number }[] = [];

  const openRe = /<(article|main|section|div)\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  let inspected = 0;
  while ((m = openRe.exec(body)) !== null && inspected < 400) {
    const tag = m[1].toLowerCase();
    const attrs = m[0];
    const hinted = tag === "article" || tag === "main" || CONTENT_HINT_RE.test(attrs);
    if (!hinted) continue;
    inspected++;
    const end = endOfElement(body, m.index, tag);
    const inner = body.slice(m.index, end);
    if (inner.length < 200) continue;
    candidates.push(textStats(inner));
  }

  // Always consider the paragraph run of the whole body as a baseline.
  const paragraphMatches: string[] = body.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) ?? [];
  const paragraphRun = paragraphMatches.join("\n");
  if (paragraphRun) candidates.push(textStats(paragraphRun));

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (best && best.text.length >= 120) return best.text;

  const fallback = htmlToText(body);
  return fallback.length >= 120 ? fallback : "";
}

// ── images ────────────────────────────────────────────────────────────────────

const IMAGE_NOISE_RE =
  /(?:sprite|logo|favicon|icon|avatar|profile-?pic|placeholder|blank\.|spacer|pixel|1x1|tracking|beacon|badge|button|arrow|bullet|loader|loading|spinner|emoji|flag[-_]|social|share|footer|header|watermark|ads?[-_/]|doubleclick|googletagmanager|facebook\.com\/tr)/i;

const IMAGE_EXT_RE = /\.(?:jpe?g|png|webp|avif|gif)(?:[?#]|$)/i;

function absolutise(src: string, baseUrl?: string): string | null {
  const raw = src.trim().replace(/&amp;/g, "&");
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return null;
  try {
    if (/^https?:\/\//i.test(raw)) return new URL(raw).href;
    if (raw.startsWith("//")) return new URL((baseUrl ? new URL(baseUrl).protocol : "https:") + raw).href;
    if (!baseUrl) return null;
    return new URL(raw, baseUrl).href;
  } catch {
    return null;
  }
}

/** Pick the widest candidate out of a srcset attribute. */
function largestFromSrcset(srcset: string): string | null {
  const parts = srcset.split(",").map((p) => p.trim()).filter(Boolean);
  let best: { url: string; w: number } | null = null;
  for (const part of parts) {
    const [url, descriptor] = part.split(/\s+/);
    if (!url) continue;
    const w = descriptor?.endsWith("w") ? parseInt(descriptor, 10) : descriptor?.endsWith("x") ? parseFloat(descriptor) * 1000 : 0;
    if (!best || w > best.w) best = { url, w: w || 0 };
  }
  return best?.url ?? null;
}

function tinyByAttributes(tag: string): boolean {
  const w = Number(tag.match(/\bwidth="?(\d{1,5})/i)?.[1] ?? 0);
  const h = Number(tag.match(/\bheight="?(\d{1,5})/i)?.[1] ?? 0);
  if (w && w < 200) return true;
  if (h && h < 120) return true;
  return false;
}

/**
 * Extract real content images from a page, absolute and de-duplicated.
 * `baseUrl` is the page URL — required for relative sources to be usable.
 */
export function extractImageUrls(html: string, baseUrl?: string): string[] {
  const found: string[] = [];
  const push = (src: string | null | undefined, opts?: { skipNoiseCheck?: boolean }) => {
    if (!src) return;
    const abs = absolutise(src, baseUrl);
    if (!abs) return;
    if (!opts?.skipNoiseCheck && IMAGE_NOISE_RE.test(abs)) return;
    if (!IMAGE_EXT_RE.test(abs) && !/\/(?:image|photo|media|uploads?)\//i.test(abs)) return;
    found.push(abs);
  };

  // 1. Social preview images first — they are the editorially chosen cover.
  const metaRe = /<meta[^>]+(?:property|name)="(og:image(?::secure_url)?|twitter:image(?::src)?)"[^>]*>/gi;
  let mm: RegExpExecArray | null;
  while ((mm = metaRe.exec(html)) !== null) {
    push(mm[0].match(/content="([^"]+)"/i)?.[1], { skipNoiseCheck: true });
  }
  push(html.match(/<link[^>]+rel="image_src"[^>]+href="([^"]+)"/i)?.[1], { skipNoiseCheck: true });

  // 2. Content images, from the de-noised markup only.
  const contentHtml = stripNonContent(html);
  const imgRe = /<img\b[^>]*>/gi;
  let im: RegExpExecArray | null;
  while ((im = imgRe.exec(contentHtml)) !== null) {
    const tag = im[0];
    if (tinyByAttributes(tag)) continue;
    if (/\brole="presentation"/i.test(tag)) continue;
    const srcset = tag.match(/\b(?:data-)?srcset="([^"]+)"/i)?.[1];
    if (srcset) push(largestFromSrcset(srcset));
    for (const attr of ["src", "data-src", "data-lazy-src", "data-original", "data-image", "data-large-file"]) {
      const v = tag.match(new RegExp(`\\b${attr}="([^"]+)"`, "i"))?.[1];
      if (v) push(v);
    }
  }

  // 3. <source> inside <picture> and CSS background images.
  const sourceRe = /<source\b[^>]*srcset="([^"]+)"[^>]*>/gi;
  let sm: RegExpExecArray | null;
  while ((sm = sourceRe.exec(contentHtml)) !== null) push(largestFromSrcset(sm[1]!));

  const bgRe = /background(?:-image)?:\s*url\((['"]?)([^'")]+)\1\)/gi;
  let bm: RegExpExecArray | null;
  while ((bm = bgRe.exec(contentHtml)) !== null) push(bm[2]);

  // De-duplicate, ignoring cache-busting query strings.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of found) {
    const key = url.split("?")[0].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
    if (out.length >= 12) break;
  }
  return out;
}

/** Best cover candidate: og:image when present, otherwise the first content image. */
export function pickCoverImage(images: string[]): string | null {
  return images.length > 0 ? images[0] : null;
}

/**
 * Normalise legacy records: if a stored value still contains HTML markup,
 * convert it to clean text. Safe to call on already-clean text.
 */
export function ensurePlainText(value: string | null | undefined): string {
  if (!value) return "";
  if (!/<[a-z!/][^>]*>/i.test(value)) return decodeEntities(value).trim();
  return htmlToText(value);
}
