/**
 * Scholarship aggregator sources - config-based.
 */
import type { ScraperConfig, ScrapedResult } from "./types.js";
import { fetchHtml, extractLinks, absoluteUrl } from "./types.js";

interface AggregatorConfig {
  name: string;
  baseUrl: string;
  listingPath: string;
  keywordPattern: RegExp;
  maxLinks: number;
  description: string;
}

const aggregators: AggregatorConfig[] = [
  { name: "Opportunity Desk", baseUrl: "https://opportunitydesk.org", listingPath: "/category/scholarships/", keywordPattern: /scholarship|opportunity|fellowship/i, maxLinks: 15, description: "Scholarship and opportunity aggregator." },
  { name: "Opportunities for Africans", baseUrl: "https://www.opportunitiesforafricans.com", listingPath: "/", keywordPattern: /scholarship|opportunity|fellowship|internship/i, maxLinks: 15, description: "African-focused opportunity aggregator." },
  { name: "After School Africa", baseUrl: "https://www.afterschoolafrica.com", listingPath: "/", keywordPattern: /scholarship|opportunity|fellowship|program/i, maxLinks: 15, description: "African student opportunity platform." },
  { name: "Scholarships Corner", baseUrl: "https://scholarshipscorner.website", listingPath: "/", keywordPattern: /scholarship|opportunity|program/i, maxLinks: 12, description: "Scholarship listings aggregator." },
  { name: "Scholarship Positions", baseUrl: "https://scholarship-positions.com", listingPath: "/", keywordPattern: /scholarship|fellowship|program|funding/i, maxLinks: 15, description: "International scholarship listings." },
  { name: "Scholars4Dev", baseUrl: "https://www.scholars4dev.com", listingPath: "/", keywordPattern: /scholarship|fellowship|program|funding/i, maxLinks: 15, description: "Scholarships for development students." },
  { name: "WeMakeScholars", baseUrl: "https://www.wemakescholars.com", listingPath: "/", keywordPattern: /scholarship|program|study/i, maxLinks: 10, description: "Indian student scholarship platform." },
  { name: "Youth Opportunities", baseUrl: "https://www.youthop.com", listingPath: "/", keywordPattern: /opportunity|scholarship|program|youth/i, maxLinks: 15, description: "Youth opportunity aggregator." },
  { name: "ScholarshipAir", baseUrl: "https://www.scholarshipair.com", listingPath: "/", keywordPattern: /scholarship|program|study/i, maxLinks: 12, description: "International scholarship directory." },
  { name: "PickAScholarship", baseUrl: "https://www.pickascholarship.com", listingPath: "/", keywordPattern: /scholarship|program|apply/i, maxLinks: 10, description: "Scholarship matching platform." },
  { name: "ScholarshipTab", baseUrl: "https://www.scholarshiptab.com", listingPath: "/", keywordPattern: /scholarship|program|opportunity/i, maxLinks: 12, description: "Scholarship listing platform." },
  { name: "Studyportals Scholarships", baseUrl: "https://www.studyportals.com", listingPath: "/scholarships/", keywordPattern: /scholarship|master|phd|bachelor/i, maxLinks: 12, description: "International study and scholarship portal." },
  { name: "Academic Positions", baseUrl: "https://academicpositions.com", listingPath: "/", keywordPattern: /position|phd|postdoc|fellowship|job/i, maxLinks: 10, description: "Academic career opportunities platform." },
  { name: "FindAMasters", baseUrl: "https://www.findamasters.com", listingPath: "/", keywordPattern: /master|scholarship|funding|program/i, maxLinks: 10, description: "Master's degree and funding platform." },
  { name: "FindAPhD", baseUrl: "https://www.findaphd.com", listingPath: "/", keywordPattern: /phd|scholarship|funding|program/i, maxLinks: 10, description: "PhD and research funding platform." },
  { name: "EURAXESS", baseUrl: "https://euraxess.ec.europa.eu", listingPath: "/", keywordPattern: /job|fellowship|position|opportunity|funding/i, maxLinks: 10, description: "European researcher mobility platform." },
];

async function scrapeAggregator(cfg: AggregatorConfig): Promise<ScrapedResult[]> {
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
        category: "Scholarships",
        applyLink: absoluteUrl(cfg.baseUrl, link.href),
        itemType: "scholarship",
        rawData: { href: link.href },
      });
    }
  }

  // No static fallback — return empty rather than a phantom homepage link.
  return results;
}

export const aggregatorScrapers: ScraperConfig[] = aggregators.map((cfg) => ({
  name: cfg.name,
  category: "aggregator" as const,
  enabled: true,
  priority: 3,
  fn: () => scrapeAggregator(cfg),
}));
