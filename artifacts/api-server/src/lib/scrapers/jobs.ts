/**
 * Global & regional job platform sources - config-based.
 */
import type { ScraperConfig, ScrapedResult } from "./types.js";
import { fetchHtml, extractLinks, absoluteUrl } from "./types.js";

interface JobPlatformConfig {
  name: string;
  baseUrl: string;
  listingPath: string;
  keywordPattern: RegExp;
  maxLinks: number;
  description: string;
  category: string;
  /** Set to false for sites with aggressive bot-blocking that return garbage HTML */
  enabled?: boolean;
}

const platforms: JobPlatformConfig[] = [
  { name: "Job in Rwanda", baseUrl: "https://www.jobinrwanda.com", listingPath: "/", keywordPattern: /job|vacancy|career|opportunity/i, maxLinks: 20, description: "Rwandan job listing platform.", category: "Jobs" },
  { name: "ReliefWeb Jobs", baseUrl: "https://reliefweb.int", listingPath: "/jobs", keywordPattern: /job|opportunity|consultancy|vacancy/i, maxLinks: 15, description: "Humanitarian and development jobs.", category: "Jobs" },
  { name: "DevelopmentAid", baseUrl: "https://www.developmentaid.org", listingPath: "/jobs", keywordPattern: /job|opportunity|consultancy|vacancy/i, maxLinks: 15, description: "International development jobs.", category: "Jobs" },
  { name: "Devex Jobs", baseUrl: "https://www.devex.com", listingPath: "/jobs", keywordPattern: /job|opportunity|consultancy|program/i, maxLinks: 15, description: "Global development career platform.", category: "Jobs" },
  { name: "Impactpool", baseUrl: "https://www.impactpool.org", listingPath: "/", keywordPattern: /job|opportunity|career|vacancy/i, maxLinks: 15, description: "UN, NGO, and impact jobs platform.", category: "Jobs" },
  { name: "Idealist", baseUrl: "https://www.idealist.org", listingPath: "/en/jobs", keywordPattern: /job|opportunity|position|career/i, maxLinks: 12, description: "Nonprofit and social impact jobs.", category: "Jobs" },
  { name: "Fuzu", baseUrl: "https://www.fuzu.com", listingPath: "/", keywordPattern: /job|career|opportunity|vacancy/i, maxLinks: 12, description: "African job platform.", category: "Jobs" },
  { name: "BrighterMonday", baseUrl: "https://www.brightermonday.com", listingPath: "/", keywordPattern: /job|career|opportunity|vacancy/i, maxLinks: 12, description: "East African job platform.", category: "Jobs" },
  { name: "HigherEdJobs", baseUrl: "https://www.higheredjobs.com", listingPath: "/", keywordPattern: /job|faculty|position|career/i, maxLinks: 12, description: "Academic job listings.", category: "Jobs" },
  { name: "Times Higher Education Jobs", baseUrl: "https://www.timeshighereducation.com", listingPath: "/unijobs", keywordPattern: /job|position|faculty|career/i, maxLinks: 10, description: "University job listings.", category: "Jobs" },
  // Disabled: aggressive bot-protection returns CAPTCHAs or empty pages, not real job links
  { name: "LinkedIn Jobs", baseUrl: "https://www.linkedin.com", listingPath: "/jobs", keywordPattern: /job|opportunity|career|position/i, maxLinks: 10, description: "Global professional network job listings.", category: "Jobs", enabled: false },
  { name: "Indeed", baseUrl: "https://www.indeed.com", listingPath: "/", keywordPattern: /job|career|opportunity|position/i, maxLinks: 10, description: "Global job search platform.", category: "Jobs", enabled: false },
];

async function scrapePlatform(cfg: JobPlatformConfig): Promise<ScrapedResult[]> {
  const url = `${cfg.baseUrl}${cfg.listingPath}`;
  const html = await fetchHtml(url);
  const results: ScrapedResult[] = [];

  if (html) {
    const links = extractLinks(html, cfg.keywordPattern);
    for (const link of links.slice(0, cfg.maxLinks)) {
      if (link.text.length < 8) continue;
      results.push({
        source: cfg.name,
        sourceUrl: absoluteUrl(cfg.baseUrl, link.href),
        title: link.text,
        description: cfg.description,
        category: cfg.category,
        applyLink: absoluteUrl(cfg.baseUrl, link.href),
        itemType: "job",
        rawData: { href: link.href },
      });
    }
  }

  // No static fallback — return empty rather than a phantom homepage link.
  return results;
}

export const jobScrapers: ScraperConfig[] = platforms.map((cfg) => ({
  name: cfg.name,
  category: "jobs" as const,
  enabled: cfg.enabled !== false,
  priority: 2,
  fn: () => scrapePlatform(cfg),
}));
