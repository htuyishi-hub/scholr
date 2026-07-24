/**
 * International scholarship provider configurations.
 * Uses a config-based approach with the generic scraper.
 */
import type { ScraperConfig, ScrapedResult } from "./types.js";
import { fetchHtml, extractLinks, absoluteUrl } from "./types.js";

interface ProviderConfig {
  name: string;
  baseUrl: string;
  listingPath: string;
  keywordPattern: RegExp;
  maxLinks: number;
  description: string;
}

const providers: ProviderConfig[] = [
  { name: "Mastercard Foundation Scholars Program", baseUrl: "https://mastercardfdn.org", listingPath: "/all/scholars/", keywordPattern: /scholarship|scholar|program/i, maxLinks: 10, description: "Scholarship from Mastercard Foundation." },
  { name: "DAAD Scholarships", baseUrl: "https://www.daad.de", listingPath: "/en/studying-in-germany/scholarships/", keywordPattern: /scholarship|funding|program/i, maxLinks: 10, description: "German government scholarship opportunity." },
  { name: "Chevening Scholarships", baseUrl: "https://www.chevening.org", listingPath: "/scholarships/", keywordPattern: /scholarship|apply|program/i, maxLinks: 8, description: "UK government global scholarship program." },
  { name: "Commonwealth Scholarships", baseUrl: "https://cscuk.fcdo.gov.uk", listingPath: "/", keywordPattern: /scholarship|fellowship|phd|master/i, maxLinks: 8, description: "Commonwealth scholarship opportunity." },
  { name: "Erasmus+ Programme", baseUrl: "https://erasmus-plus.ec.europa.eu", listingPath: "/opportunities/", keywordPattern: /opportunity|mobility|exchange|scholarship/i, maxLinks: 8, description: "EU education and mobility opportunity." },
  { name: "Fulbright Program", baseUrl: "https://fulbrightprogram.org", listingPath: "/student-programs/", keywordPattern: /student|scholarship|grant|program/i, maxLinks: 8, description: "US government international exchange program." },
  { name: "Gates Cambridge Scholarship", baseUrl: "https://www.gatescambridge.org", listingPath: "/apply/", keywordPattern: /scholarship|apply|funding/i, maxLinks: 5, description: "Fully funded graduate scholarship at Cambridge." },
  { name: "Rhodes Scholarship", baseUrl: "https://www.rhodeshouse.ox.ac.uk", listingPath: "/scholarships/", keywordPattern: /scholarship|apply|program/i, maxLinks: 5, description: "Prestigious international scholarship at Oxford." },
  { name: "Schwarzman Scholars", baseUrl: "https://www.schwarzmanscholars.org", listingPath: "/", keywordPattern: /scholarship|apply|program|master/i, maxLinks: 5, description: "Fully funded master's at Tsinghua University." },
  { name: "Türkiye Scholarships", baseUrl: "https://www.turkiyeburslari.gov.tr", listingPath: "/", keywordPattern: /scholarship|program|apply/i, maxLinks: 8, description: "Turkish government scholarship program." },
  { name: "Australia Awards", baseUrl: "https://www.australiaawardsafrica.org", listingPath: "/", keywordPattern: /scholarship|award|apply|program/i, maxLinks: 8, description: "Australian government development scholarships." },
  { name: "Stipendium Hungaricum", baseUrl: "https://stipendiumhungaricum.hu", listingPath: "/", keywordPattern: /scholarship|program|apply|study/i, maxLinks: 8, description: "Hungarian government scholarship program." },
  { name: "Aga Khan Foundation Scholarships", baseUrl: "https://the.akdn", listingPath: "/en/what-we-do/developing-human-capacity/education/international-scholarships", keywordPattern: /scholarship|education|program/i, maxLinks: 5, description: "International scholarship from Aga Khan Foundation." },
  { name: "SINGA Scholarship", baseUrl: "https://www.a-star.edu.sg", listingPath: "/Scholarships/singa-scholarship", keywordPattern: /scholarship|phd|apply/i, maxLinks: 5, description: "Singapore International Graduate Award for PhD." },
  { name: "Orange Knowledge Programme", baseUrl: "https://www.studyinnl.org", listingPath: "/finances/orange-knowledge-programme", keywordPattern: /scholarship|program|apply/i, maxLinks: 5, description: "Dutch government scholarship program." },
  { name: "Knight-Hennessy Scholars", baseUrl: "https://knight-hennessy.stanford.edu", listingPath: "/", keywordPattern: /scholarship|apply|program|graduate/i, maxLinks: 5, description: "Graduate scholarship at Stanford University." },
  { name: "Yenching Academy", baseUrl: "https://yenchingacademy.org", listingPath: "/", keywordPattern: /fellowship|scholarship|apply|program/i, maxLinks: 5, description: "Fellowship at Peking University." },
  { name: "Mandela Rhodes Foundation", baseUrl: "https://www.mandelarhodes.org", listingPath: "/", keywordPattern: /scholarship|apply|leadership|program/i, maxLinks: 5, description: "Scholarship and leadership program for African students." },
  { name: "VLIR-UOS Scholarships", baseUrl: "https://www.vliruos.be", listingPath: "/en/scholarships/", keywordPattern: /scholarship|master|training|program/i, maxLinks: 5, description: "Belgian government scholarship for international students." },
  { name: "Swedish Institute Scholarships", baseUrl: "https://si.se", listingPath: "/en/apply/scholarships/", keywordPattern: /scholarship|program|apply|study/i, maxLinks: 6, description: "Swedish government scholarship opportunity." },
  { name: "MEXT (Japan) Scholarships", baseUrl: "https://www.studyinjapan.go.jp", listingPath: "/en/", keywordPattern: /scholarship|program|apply|study/i, maxLinks: 6, description: "Japanese government MEXT scholarship program." },
  { name: "Chinese Government CSC Scholarship", baseUrl: "https://www.campuschina.org", listingPath: "/", keywordPattern: /scholarship|program|apply|admission/i, maxLinks: 6, description: "Chinese government scholarship for international students." },
  { name: "ADB-Japan Scholarship Program", baseUrl: "https://www.adb.org", listingPath: "/work-with-us/careers/japan-scholarship-program", keywordPattern: /scholarship|program|graduate/i, maxLinks: 5, description: "Asian Development Bank graduate scholarship." },
  { name: "DAFI (UNHCR) Scholarship", baseUrl: "https://www.unhcr.org", listingPath: "/what-we-do/education/dafi-scholarship-programme", keywordPattern: /scholarship|education|program/i, maxLinks: 3, description: "UNHCR scholarship for refugee students." },
  { name: "Wells Mountain Initiative", baseUrl: "https://www.wellsmountaininitiative.org", listingPath: "/", keywordPattern: /scholarship|program|apply|education/i, maxLinks: 5, description: "International scholarship for developing country students." },
  { name: "Open Society Foundations", baseUrl: "https://www.opensocietyfoundations.org", listingPath: "/grants", keywordPattern: /grant|fellowship|scholarship|program/i, maxLinks: 8, description: "Grant and fellowship opportunities from OSF." },
  { name: "Erasmus Mundus Joint Masters", baseUrl: "https://www.eacea.ec.europa.eu", listingPath: "/scholarships/erasmus-mundus-catalogue_en", keywordPattern: /master|scholarship|program|joint/i, maxLinks: 8, description: "Joint Master's scholarships from Erasmus Mundus." },
  { name: "Canon Foundation in Europe", baseUrl: "https://www.canonfoundation.org", listingPath: "/", keywordPattern: /fellowship|research|program|apply/i, maxLinks: 5, description: "Research fellowship from Canon Foundation." },
  { name: "Inlaks Shivdasani Foundation", baseUrl: "https://www.inlaksfoundation.org", listingPath: "/", keywordPattern: /scholarship|program|apply|education/i, maxLinks: 5, description: "Scholarship from Inlaks Foundation." },
  { name: "Obama Foundation Scholars", baseUrl: "https://www.obama.org", listingPath: "/programs/scholars", keywordPattern: /scholar|program|apply|leadership/i, maxLinks: 5, description: "Obama Foundation leadership program." },
];

async function scrapeProvider(cfg: ProviderConfig): Promise<ScrapedResult[]> {
  const url = cfg.baseUrl.endsWith("/") ? `${cfg.baseUrl}${cfg.listingPath.replace(/^\//, "")}` : `${cfg.baseUrl}${cfg.listingPath}`.replace(/\/\//g, "/");
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

export const providerScrapers: ScraperConfig[] = providers.map((cfg) => ({
  name: cfg.name,
  category: "provider" as const,
  country: cfg.name.includes("Rwanda") ? "Rwanda" : undefined,
  enabled: true,
  priority: 2,
  fn: () => scrapeProvider(cfg),
}));
