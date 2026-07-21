/**
 * UN agencies, NGOs, and Development Banks scraper sources - config-based.
 */
import type { ScraperConfig, ScrapedResult } from "./types.js";
import { fetchHtml, extractLinks, absoluteUrl } from "./types.js";

interface UNConfig {
  name: string;
  baseUrl: string;
  listingPath: string;
  keywordPattern: RegExp;
  maxLinks: number;
  description: string;
  category: string;
}

const organizations: UNConfig[] = [
  // United Nations agencies
  { name: "UN Careers", baseUrl: "https://careers.un.org", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 15, description: "United Nations career opportunities.", category: "Jobs" },
  { name: "UNDP Jobs", baseUrl: "https://jobs.undp.org", listingPath: "/", keywordPattern: /job|vacancy|opportunity|consultancy/i, maxLinks: 12, description: "UNDP global job listings.", category: "Jobs" },
  { name: "UNICEF Careers", baseUrl: "https://jobs.unicef.org", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 12, description: "UNICEF career opportunities.", category: "Jobs" },
  { name: "UNESCO Careers", baseUrl: "https://careers.unesco.org", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "UNESCO career opportunities.", category: "Jobs" },
  { name: "UN Women Jobs", baseUrl: "https://jobs.unwomen.org", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "UN Women career opportunities.", category: "Jobs" },
  { name: "UNHCR Careers", baseUrl: "https://www.unhcr.org/careers", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "UNHCR career opportunities.", category: "Jobs" },
  { name: "WFP Careers", baseUrl: "https://www.wfp.org/careers", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "World Food Programme careers.", category: "Jobs" },
  { name: "WHO Careers", baseUrl: "https://www.who.int/careers", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "World Health Organization careers.", category: "Jobs" },
  { name: "FAO Careers", baseUrl: "https://www.fao.org/employment", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "FAO career opportunities.", category: "Jobs" },
  { name: "IOM Careers", baseUrl: "https://www.iom.int/careers", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "IOM career opportunities.", category: "Jobs" },
  { name: "ILO Jobs", baseUrl: "https://jobs.ilo.org", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "International Labour Organization careers.", category: "Jobs" },
  { name: "UNEP Careers", baseUrl: "https://www.unep.org/careers", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "UN Environment Programme careers.", category: "Jobs" },
  { name: "UNOPS Jobs", baseUrl: "https://jobs.unops.org", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "UNOPS career opportunities.", category: "Jobs" },

  // NGOs
  { name: "Save the Children", baseUrl: "https://www.savethechildren.net", listingPath: "/careers", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "Save the Children career opportunities.", category: "Jobs" },
  { name: "Plan International", baseUrl: "https://plan-international.org", listingPath: "/careers", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "Plan International career opportunities.", category: "Jobs" },
  { name: "CARE", baseUrl: "https://careers.care.org", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "CARE career opportunities.", category: "Jobs" },
  { name: "Mercy Corps", baseUrl: "https://careers.mercycorps.org", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "Mercy Corps career opportunities.", category: "Jobs" },
  { name: "BRAC", baseUrl: "https://www.brac.net", listingPath: "/career", keywordPattern: /job|vacancy|opportunity|position|career/i, maxLinks: 10, description: "BRAC career opportunities.", category: "Jobs" },
  { name: "World Vision", baseUrl: "https://careers.wvi.org", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "World Vision career opportunities.", category: "Jobs" },
  { name: "One Acre Fund", baseUrl: "https://oneacrefund.org", listingPath: "/careers", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "One Acre Fund career opportunities.", category: "Jobs" },
  { name: "ActionAid", baseUrl: "https://actionaid.org", listingPath: "/jobs", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "ActionAid career opportunities.", category: "Jobs" },
  { name: "Oxfam", baseUrl: "https://jobs.oxfam.org.uk", listingPath: "/", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "Oxfam career opportunities.", category: "Jobs" },
  { name: "SNV", baseUrl: "https://www.snv.org", listingPath: "/careers", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "SNV career opportunities.", category: "Jobs" },
  { name: "FHI 360", baseUrl: "https://www.fhi360.org", listingPath: "/careers", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "FHI 360 career opportunities.", category: "Jobs" },
  { name: "TechnoServe", baseUrl: "https://www.technoserve.org", listingPath: "/careers", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "TechnoServe career opportunities.", category: "Jobs" },

  // Development Banks
  { name: "World Bank Careers", baseUrl: "https://www.worldbank.org", listingPath: "/en/about/careers", keywordPattern: /job|vacancy|opportunity|position|program/i, maxLinks: 10, description: "World Bank career opportunities.", category: "Jobs" },
  { name: "IFC Careers", baseUrl: "https://www.ifc.org", listingPath: "/careers", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "International Finance Corporation careers.", category: "Jobs" },
  { name: "African Development Bank", baseUrl: "https://www.afdb.org", listingPath: "/en/about-us/careers", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 10, description: "African Development Bank career opportunities.", category: "Jobs" },
  { name: "Islamic Development Bank", baseUrl: "https://www.isdb.org", listingPath: "/careers", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "IsDB career opportunities.", category: "Jobs" },
  { name: "European Investment Bank", baseUrl: "https://www.eib.org", listingPath: "/en/about/careers", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "EIB career opportunities.", category: "Jobs" },
  { name: "Asian Development Bank", baseUrl: "https://www.adb.org", listingPath: "/work-with-us/careers", keywordPattern: /job|vacancy|opportunity|position/i, maxLinks: 8, description: "ADB career opportunities.", category: "Jobs" },
];

async function scrapeOrganization(cfg: UNConfig): Promise<ScrapedResult[]> {
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

  if (!results.length) {
    results.push({
      source: cfg.name,
      sourceUrl: url,
      title: `${cfg.name} — Career Opportunities`,
      description: cfg.description,
      category: cfg.category,
      applyLink: url,
      itemType: "job",
      rawData: { static: true },
    });
  }

  return results;
}

export const unNgoScrapers: ScraperConfig[] = organizations.map((cfg) => ({
  name: cfg.name,
  category: "ngo" as const,
  enabled: true,
  priority: 3,
  fn: () => scrapeOrganization(cfg),
}));
