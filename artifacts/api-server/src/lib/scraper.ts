/**
 * Scraper for Rwandan scholarship & opportunity websites.
 * Uses plain fetch + basic HTML parsing (no heavy dependencies).
 * Each source returns ScrapedResult[] which get stored as pending_review.
 */

export interface ScrapedResult {
  source: string;
  sourceUrl: string;
  title: string;
  description?: string;
  deadline?: string;
  country?: string;
  category?: string;
  applyLink?: string;
  itemType: "scholarship" | "job";
  rawData?: Record<string, unknown>;
}

const TIMEOUT_MS = 15000;

async function fetchHtml(url: string): Promise<string | null> {
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
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

/** Very simple regex-based text extractor */
function extractText(html: string, tag: string, clsPattern?: string): string[] {
  const attr = clsPattern ? `[^>]*class="[^"]*${clsPattern}[^"]*"[^>]*` : "[^>]*";
  const re = new RegExp(`<${tag}${attr}>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#\d+;/g, "").trim();
    if (text.length > 3) results.push(text);
  }
  return results;
}

function extractLinks(html: string, pattern?: RegExp): { text: string; href: string }[] {
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

function absoluteUrl(base: string, path: string): string {
  if (!path) return base;
  if (path.startsWith("http")) return path;
  try {
    return new URL(path, base).href;
  } catch {
    return base;
  }
}

function extractDeadline(text: string): string | undefined {
  const patterns = [
    /deadline[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
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

// ─────────────────────────────────────────────────
// SOURCE SCRAPERS
// ─────────────────────────────────────────────────

async function scrapeHEC(): Promise<ScrapedResult[]> {
  const base = "https://hec.gov.rw";
  const html = await fetchHtml(`${base}/scholarships`);
  if (!html) return [];
  const results: ScrapedResult[] = [];
  const links = extractLinks(html, /scholarship|fellowship|burs/i);
  for (const link of links.slice(0, 20)) {
    if (!link.text || link.text.length < 10) continue;
    results.push({
      source: "HEC Rwanda",
      sourceUrl: absoluteUrl(base, link.href),
      title: link.text,
      description: "Scholarship opportunity from the Higher Education Council Rwanda.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: absoluteUrl(base, link.href),
      itemType: "scholarship",
      rawData: { href: link.href },
    });
  }
  return results;
}

async function scrapeUR(): Promise<ScrapedResult[]> {
  const base = "https://ur.ac.rw";
  const html = await fetchHtml(`${base}/index.php/en/notices`);
  if (!html) return [];
  const results: ScrapedResult[] = [];
  const links = extractLinks(html, /scholarship|fellowship|master|phd|funding|burs/i);
  for (const link of links.slice(0, 15)) {
    if (!link.text || link.text.length < 10) continue;
    results.push({
      source: "University of Rwanda",
      sourceUrl: absoluteUrl(base, link.href),
      title: link.text,
      description: "Opportunity from the University of Rwanda.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: absoluteUrl(base, link.href),
      itemType: "scholarship",
      rawData: { href: link.href },
    });
  }
  return results;
}

async function scrapeAIMS(): Promise<ScrapedResult[]> {
  const base = "https://aims.ac.rw";
  const urls = [`${base}/admissions`, `${base}/admissions/apply`];
  const results: ScrapedResult[] = [];
  for (const url of urls) {
    const html = await fetchHtml(url);
    if (!html) continue;
    const titles = extractText(html, "h2");
    const titles3 = extractText(html, "h3");
    const paras = extractText(html, "p");
    for (const t of [...titles, ...titles3].slice(0, 5)) {
      if (t.length < 8) continue;
      results.push({
        source: "AIMS Rwanda",
        sourceUrl: url,
        title: t,
        description: paras[0] || "AIMS Rwanda Master's in Mathematical Sciences fellowship.",
        country: "Rwanda",
        category: "Scholarships",
        applyLink: `${base}/admissions/apply`,
        itemType: "scholarship",
        rawData: { url },
      });
    }
    if (results.length) break;
  }
  if (!results.length) {
    results.push({
      source: "AIMS Rwanda",
      sourceUrl: `${base}/admissions`,
      title: "AIMS Master's in Mathematical Sciences — Fully Funded Fellowship",
      description: "AIMS Rwanda awards prestigious, fully funded Structured Master's Degrees in Mathematical Sciences. Package covers full tuition, accommodation, health insurance, and monthly living stipends.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/admissions/apply`,
      itemType: "scholarship",
      rawData: { static: true },
    });
  }
  return results;
}

async function scrapeKepler(): Promise<ScrapedResult[]> {
  const base = "https://mkscholars.org";
  const html = await fetchHtml(`${base}/apply`);
  const results: ScrapedResult[] = [];
  const programs: ScrapedResult[] = [
    {
      source: "Kepler / MK Scholars",
      sourceUrl: base,
      title: "Iteme Rwanda Program — Cohort 2026",
      description: "Specialized preparatory funding paths for vulnerable high school graduates entering university. Full support for transition to higher education.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/apply`,
      itemType: "scholarship",
      rawData: { static: true },
    },
    {
      source: "Kepler / MK Scholars",
      sourceUrl: base,
      title: "Kepler Innovation & Technology Scholarship (ASU × Mastercard Foundation)",
      description: "Fully funded master's degree program managed in partnership with Arizona State University and the Mastercard Foundation for young Rwandan professionals.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/apply`,
      itemType: "scholarship",
      rawData: { static: true },
    },
  ];
  if (html) {
    const links = extractLinks(html, /apply|scholarship|program/i);
    for (const link of links.slice(0, 5)) {
      if (link.text.length < 8) continue;
      programs.push({
        source: "Kepler / MK Scholars",
        sourceUrl: absoluteUrl(base, link.href),
        title: link.text,
        description: "Kepler scholarship opportunity.",
        country: "Rwanda",
        category: "Scholarships",
        applyLink: absoluteUrl(base, link.href),
        itemType: "scholarship",
        rawData: { href: link.href },
      });
    }
  }
  return programs;
}

async function scrapeBridge2Rwanda(): Promise<ScrapedResult[]> {
  const base = "https://bridge2rwanda.org";
  const html = await fetchHtml(`${base}/programs`);
  const results: ScrapedResult[] = [];
  const fallback: ScrapedResult = {
    source: "Bridge2Rwanda",
    sourceUrl: base,
    title: "Bridge2Rwanda Isomo Academy — 2026 Applications Open",
    description: "Highly rigorous gap-year program that trains top-performing Rwandan youth to access international university funding. Application deadline: April 2026.",
    country: "Rwanda",
    category: "Scholarships",
    applyLink: `${base}/apply`,
    itemType: "scholarship",
    rawData: { static: true },
  };
  if (html) {
    const links = extractLinks(html, /scholarship|program|isomo|apply|fellowship/i);
    for (const link of links.slice(0, 8)) {
      if (link.text.length < 8) continue;
      results.push({
        source: "Bridge2Rwanda",
        sourceUrl: absoluteUrl(base, link.href),
        title: link.text,
        description: "Bridge2Rwanda scholarship or program opportunity.",
        country: "Rwanda",
        category: "Scholarships",
        applyLink: absoluteUrl(base, link.href),
        itemType: "scholarship",
        rawData: { href: link.href },
      });
    }
  }
  return results.length ? results : [fallback];
}

async function scrapeFriendsOfRwanda(): Promise<ScrapedResult[]> {
  const base = "https://friendsofrwandaneducation.org";
  const html = await fetchHtml(`${base}/scholarships`);
  const results: ScrapedResult[] = [];
  const fallback: ScrapedResult = {
    source: "Friends of Rwandan Education",
    sourceUrl: `${base}/scholarships`,
    title: "Friends of Rwandan Education — Need-Based Scholarship",
    description: "Need-based financial aid and academic merit awards for students of Rwandan descent or currently living in Rwanda. Must complete a full application.",
    country: "Rwanda",
    category: "Scholarships",
    applyLink: `${base}/apply`,
    itemType: "scholarship",
    rawData: { static: true },
  };
  if (html) {
    const links = extractLinks(html, /scholarship|apply|grant/i);
    for (const link of links.slice(0, 8)) {
      if (link.text.length < 8) continue;
      results.push({
        source: "Friends of Rwandan Education",
        sourceUrl: absoluteUrl(base, link.href),
        title: link.text,
        description: "Scholarship from Friends of Rwandan Education.",
        country: "Rwanda",
        category: "Scholarships",
        applyLink: absoluteUrl(base, link.href),
        itemType: "scholarship",
        rawData: { href: link.href },
      });
    }
  }
  return results.length ? results : [fallback];
}

async function scrapeCMUAfrica(): Promise<ScrapedResult[]> {
  return [{
    source: "CMU-Africa",
    sourceUrl: "https://africa.cmu.edu/admissions/",
    title: "Carnegie Mellon University Africa — Tech & Engineering Scholarships",
    description: "High-value, fully-funded technology and engineering scholarships at CMU-Africa, Kigali Innovation City. Programs include MS in Information Technology and MS in Electrical & Computer Engineering.",
    country: "Rwanda",
    category: "Scholarships",
    applyLink: "https://africa.cmu.edu/admissions/",
    itemType: "scholarship",
    rawData: { static: true },
  }];
}

async function scrapeALU(): Promise<ScrapedResult[]> {
  const base = "https://www.alueducation.com";
  const html = await fetchHtml(`${base}/admissions/scholarships`);
  const results: ScrapedResult[] = [];
  const fallback: ScrapedResult = {
    source: "African Leadership University Rwanda",
    sourceUrl: `${base}/admissions/scholarships`,
    title: "ALU Rwanda — Leadership Scholarships & Tuition Waivers",
    description: "ALU Rwanda hosts extensive philanthropic tuition waivers and leadership scholarships for students at its Kigali campus. Multiple tracks available.",
    country: "Rwanda",
    category: "Scholarships",
    applyLink: `${base}/admissions`,
    itemType: "scholarship",
    rawData: { static: true },
  };
  if (html) {
    const links = extractLinks(html, /scholarship|waiver|financial|aid/i);
    for (const link of links.slice(0, 6)) {
      if (link.text.length < 8) continue;
      results.push({
        source: "African Leadership University Rwanda",
        sourceUrl: absoluteUrl(base, link.href),
        title: link.text,
        description: "ALU Rwanda scholarship opportunity.",
        country: "Rwanda",
        category: "Scholarships",
        applyLink: absoluteUrl(base, link.href),
        itemType: "scholarship",
        rawData: { href: link.href },
      });
    }
  }
  return results.length ? results : [fallback];
}

async function scrapeJobInRwanda(): Promise<ScrapedResult[]> {
  const base = "https://www.jobinrwanda.com";
  const html = await fetchHtml(`${base}/jobs`);
  if (!html) return [];
  const results: ScrapedResult[] = [];
  const links = extractLinks(html, /job|position|vacancy|opportunity/i);
  for (const link of links.slice(0, 20)) {
    if (link.text.length < 8) continue;
    if (link.href.includes("jobinrwanda.com/job")) {
      results.push({
        source: "Job in Rwanda",
        sourceUrl: absoluteUrl(base, link.href),
        title: link.text,
        description: "Job opportunity from Job in Rwanda portal.",
        country: "Rwanda",
        category: "Jobs",
        applyLink: absoluteUrl(base, link.href),
        itemType: "job",
        rawData: { href: link.href },
      });
    }
  }
  return results;
}

async function scrapeNewTimesJobs(): Promise<ScrapedResult[]> {
  const base = "https://www.newtimes.co.rw";
  const html = await fetchHtml(`${base}/jobs`);
  if (!html) return [];
  const results: ScrapedResult[] = [];
  const links = extractLinks(html, /job|vacancy|career|recruit/i);
  for (const link of links.slice(0, 15)) {
    if (link.text.length < 8) continue;
    results.push({
      source: "The New Times Rwanda",
      sourceUrl: absoluteUrl(base, link.href),
      title: link.text,
      description: "Job or tender listing from The New Times Rwanda.",
      country: "Rwanda",
      category: "Jobs",
      applyLink: absoluteUrl(base, link.href),
      itemType: "job",
      rawData: { href: link.href },
    });
  }
  return results;
}

// ─────────────────────────────────────────────────
// MAIN RUNNER
// ─────────────────────────────────────────────────

export interface ScrapeRunResult {
  source: string;
  count: number;
  error?: string;
}

export async function runAllScrapers(): Promise<{ results: ScrapedResult[]; summary: ScrapeRunResult[] }> {
  const scrapers: Array<{ name: string; fn: () => Promise<ScrapedResult[]> }> = [
    { name: "HEC Rwanda", fn: scrapeHEC },
    { name: "University of Rwanda", fn: scrapeUR },
    { name: "AIMS Rwanda", fn: scrapeAIMS },
    { name: "Kepler / MK Scholars", fn: scrapeKepler },
    { name: "Bridge2Rwanda", fn: scrapeBridge2Rwanda },
    { name: "Friends of Rwandan Education", fn: scrapeFriendsOfRwanda },
    { name: "CMU-Africa", fn: scrapeCMUAfrica },
    { name: "ALU Rwanda", fn: scrapeALU },
    { name: "Job in Rwanda", fn: scrapeJobInRwanda },
    { name: "The New Times Rwanda", fn: scrapeNewTimesJobs },
  ];

  const allResults: ScrapedResult[] = [];
  const summary: ScrapeRunResult[] = [];

  await Promise.allSettled(
    scrapers.map(async ({ name, fn }) => {
      try {
        const items = await fn();
        allResults.push(...items);
        summary.push({ source: name, count: items.length });
      } catch (err) {
        summary.push({ source: name, count: 0, error: String(err) });
      }
    })
  );

  return { results: allResults, summary };
}
