/**
 * Tech student programs, Fellowships, Competitions & Research funding scraper sources.
 */
import type { ScraperConfig, ScrapedResult } from "./types.js";
import { fetchHtml, extractLinks, absoluteUrl } from "./types.js";

interface MiscConfig {
  name: string;
  baseUrl: string;
  listingPath: string;
  keywordPattern: RegExp;
  maxLinks: number;
  description: string;
  itemType: "scholarship" | "job";
  category: string;
}

const opportunities: MiscConfig[] = [
  // Tech Student Programs
  { name: "Google for Students", baseUrl: "https://buildyourfuture.withgoogle.com", listingPath: "/", keywordPattern: /program|scholarship|internship|fellowship/i, maxLinks: 8, description: "Google student programs and opportunities.", itemType: "scholarship", category: "Scholarships" },
  { name: "Microsoft Students", baseUrl: "https://careers.microsoft.com/students", listingPath: "/", keywordPattern: /program|internship|opportunity|scholarship/i, maxLinks: 8, description: "Microsoft student career opportunities.", itemType: "job", category: "Jobs" },
  { name: "GitHub Education", baseUrl: "https://education.github.com", listingPath: "/", keywordPattern: /student|program|pack|benefit/i, maxLinks: 6, description: "GitHub Student Developer Pack and programs.", itemType: "scholarship", category: "Scholarships" },
  { name: "AWS Educate", baseUrl: "https://aws.amazon.com", listingPath: "/education/awseducate", keywordPattern: /student|education|program|credit/i, maxLinks: 6, description: "AWS cloud education for students.", itemType: "scholarship", category: "Scholarships" },
  { name: "NVIDIA Academic Programs", baseUrl: "https://www.nvidia.com", listingPath: "/en-us/industries/higher-education-research", keywordPattern: /program|scholarship|student|education/i, maxLinks: 6, description: "NVIDIA academic and research programs.", itemType: "scholarship", category: "Scholarships" },
  { name: "Cisco Networking Academy", baseUrl: "https://www.netacad.com", listingPath: "/", keywordPattern: /course|program|certification|student/i, maxLinks: 6, description: "Cisco IT and networking courses.", itemType: "scholarship", category: "Scholarships" },
  { name: "IBM SkillsBuild", baseUrl: "https://skillsbuild.org", listingPath: "/", keywordPattern: /skill|course|program|student/i, maxLinks: 6, description: "IBM digital skills program.", itemType: "scholarship", category: "Scholarships" },
  { name: "Meta Careers", baseUrl: "https://www.metacareers.com", listingPath: "/", keywordPattern: /internship|program|student|career/i, maxLinks: 8, description: "Meta career and internship opportunities.", itemType: "job", category: "Jobs" },
  { name: "Apple Students", baseUrl: "https://www.apple.com/careers", listingPath: "/", keywordPattern: /student|internship|program|career/i, maxLinks: 6, description: "Apple student career opportunities.", itemType: "job", category: "Jobs" },

  // Fellowships
  { name: "Echoing Green", baseUrl: "https://echoinggreen.org", listingPath: "/", keywordPattern: /fellowship|program|apply|social/i, maxLinks: 5, description: "Social entrepreneurship fellowship.", itemType: "scholarship", category: "Scholarships" },
  { name: "Acumen Fellows", baseUrl: "https://acumen.org", listingPath: "/fellows", keywordPattern: /fellowship|program|apply|leadership/i, maxLinks: 5, description: "Acumen leadership fellowship.", itemType: "scholarship", category: "Scholarships" },
  { name: "Atlas Corps", baseUrl: "https://atlascorps.org", listingPath: "/", keywordPattern: /fellowship|program|apply|leadership/i, maxLinks: 5, description: "International leadership fellowship.", itemType: "scholarship", category: "Scholarships" },
  { name: "YALI", baseUrl: "https://yali.state.gov", listingPath: "/", keywordPattern: /program|fellow|leadership|opportunity/i, maxLinks: 5, description: "Young African Leaders Initiative programs.", itemType: "scholarship", category: "Scholarships" },
  { name: "Eisenhower Fellowships", baseUrl: "https://www.efworld.org", listingPath: "/", keywordPattern: /fellowship|program|apply|leadership/i, maxLinks: 5, description: "Eisenhower leadership fellowship.", itemType: "scholarship", category: "Scholarships" },
  { name: "Ashoka Fellows", baseUrl: "https://www.ashoka.org", listingPath: "/", keywordPattern: /fellow|program|apply|social/i, maxLinks: 5, description: "Ashoka social entrepreneurship fellowship.", itemType: "scholarship", category: "Scholarships" },
  { name: "Obama Leaders Africa", baseUrl: "https://www.obama.org", listingPath: "/africa", keywordPattern: /program|leader|apply|opportunity/i, maxLinks: 5, description: "Obama Foundation Leaders Africa program.", itemType: "scholarship", category: "Scholarships" },

  // Competitions & Innovation Challenges
  { name: "Hult Prize", baseUrl: "https://www.hultprize.org", listingPath: "/", keywordPattern: /competition|apply|program|challenge/i, maxLinks: 5, description: "Global student social entrepreneurship competition.", itemType: "scholarship", category: "Scholarships" },
  { name: "MIT Solve", baseUrl: "https://solve.mit.edu", listingPath: "/", keywordPattern: /challenge|solution|apply|program/i, maxLinks: 5, description: "MIT global innovation challenges.", itemType: "scholarship", category: "Scholarships" },
  { name: "XPRIZE", baseUrl: "https://www.xprize.org", listingPath: "/", keywordPattern: /prize|competition|challenge|program/i, maxLinks: 5, description: "Global prize competitions for innovation.", itemType: "scholarship", category: "Scholarships" },
  { name: "GoGettaz", baseUrl: "https://gogettaz.africa", listingPath: "/", keywordPattern: /competition|prize|program|apply/i, maxLinks: 3, description: "African agripreneur competition.", itemType: "scholarship", category: "Scholarships" },
  { name: "Global Student Prize", baseUrl: "https://www.globalstudentprize.org", listingPath: "/", keywordPattern: /prize|student|apply|program/i, maxLinks: 3, description: "Global Student Prize award.", itemType: "scholarship", category: "Scholarships" },
  { name: "Microsoft Imagine Cup", baseUrl: "https://imaginecup.microsoft.com", listingPath: "/", keywordPattern: /competition|program|student|apply/i, maxLinks: 4, description: "Microsoft global student technology competition.", itemType: "scholarship", category: "Scholarships" },
  { name: "Google Solution Challenge", baseUrl: "https://developers.google.com", listingPath: "/community/gdsc-solution-challenge", keywordPattern: /challenge|solution|student|program/i, maxLinks: 3, description: "Google Developer Student Clubs challenge.", itemType: "scholarship", category: "Scholarships" },
  { name: "Huawei ICT Competition", baseUrl: "https://e.huawei.com", listingPath: "/en/talent", keywordPattern: /competition|program|talent|student/i, maxLinks: 4, description: "Huawei ICT talent competition.", itemType: "scholarship", category: "Scholarships" },
  { name: "Seedstars", baseUrl: "https://www.seedstars.com", listingPath: "/", keywordPattern: /competition|program|startup|apply/i, maxLinks: 4, description: "Global startup competition platform.", itemType: "scholarship", category: "Scholarships" },

  // Research Funding
  { name: "Marie Curie Actions", baseUrl: "https://marie-sklodowska-curie-actions.ec.europa.eu", listingPath: "/", keywordPattern: /fellowship|program|research|funding/i, maxLinks: 6, description: "EU research fellowship program.", itemType: "scholarship", category: "Scholarships" },
  { name: "Horizon Europe", baseUrl: "https://research-and-innovation.ec.europa.eu", listingPath: "/", keywordPattern: /funding|program|research|opportunity/i, maxLinks: 6, description: "EU research and innovation program.", itemType: "scholarship", category: "Scholarships" },
  { name: "Alexander von Humboldt Foundation", baseUrl: "https://www.humboldt-foundation.de", listingPath: "/", keywordPattern: /fellowship|research|program|funding/i, maxLinks: 6, description: "German research fellowship programs.", itemType: "scholarship", category: "Scholarships" },
  { name: "DAAD Research Grants", baseUrl: "https://www.daad.de", listingPath: "/en/studying-in-germany/scholarships", keywordPattern: /research|grant|scholarship|phd/i, maxLinks: 6, description: "DAAD research funding in Germany.", itemType: "scholarship", category: "Scholarships" },
];

async function scrapeOpportunity(cfg: MiscConfig): Promise<ScrapedResult[]> {
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
        itemType: cfg.itemType,
        rawData: { href: link.href },
      });
    }
  }

  if (!results.length) {
    results.push({
      source: cfg.name,
      sourceUrl: url,
      title: `${cfg.name} — Opportunity`,
      description: cfg.description,
      category: cfg.category,
      applyLink: url,
      itemType: cfg.itemType,
      rawData: { static: true },
    });
  }

  return results;
}

export const miscScrapers: ScraperConfig[] = opportunities.map((cfg) => ({
  name: cfg.name,
  category: "tech" as const,
  enabled: true,
  priority: 3,
  fn: () => scrapeOpportunity(cfg),
}));
