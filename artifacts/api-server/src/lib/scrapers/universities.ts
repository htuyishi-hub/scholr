/**
 * Rwanda University scraper sources.
 * Adapted from the old monolithic scraper.ts into the module pattern.
 */
import type { ScraperConfig, ScrapedResult } from "./types.js";
import {
  fetchHtml,
  extractLinks,
  absoluteUrl,
} from "./types.js";

// ── University of Rwanda ──

async function scrapeUR(): Promise<ScrapedResult[]> {
  const base = "https://ur.ac.rw";
  const html = await fetchHtml(`${base}/index.php/en/notices`);
  const results: ScrapedResult[] = [];
  if (!html) {
    results.push({
      source: "University of Rwanda",
      sourceUrl: `${base}/index.php/en/notices`,
      title: "University of Rwanda — Scholarship & Research Opportunities",
      description: "Opportunity from the University of Rwanda.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/index.php/en/notices`,
      itemType: "scholarship",
      rawData: { static: true },
    });
    return results;
  }
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

// ── CMU-Africa ──

async function scrapeCMUAfrica(): Promise<ScrapedResult[]> {
  return [{
    source: "CMU-Africa",
    sourceUrl: "https://africa.cmu.edu/admissions/",
    title: "Carnegie Mellon University Africa — Tech & Engineering Scholarships",
    description: "High-value, fully-funded technology and engineering scholarships at CMU-Africa, Kigali Innovation City.",
    country: "Rwanda",
    category: "Scholarships",
    applyLink: "https://africa.cmu.edu/admissions/",
    itemType: "scholarship",
    rawData: { static: true },
  }];
}

// ── ALU Rwanda ──

async function scrapeALU(): Promise<ScrapedResult[]> {
  const base = "https://www.alueducation.com";
  const html = await fetchHtml(`${base}/admissions/scholarships`);
  const results: ScrapedResult[] = [];
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
  if (!results.length) {
    results.push({
      source: "African Leadership University Rwanda",
      sourceUrl: `${base}/admissions/scholarships`,
      title: "ALU Rwanda — Leadership Scholarships & Tuition Waivers",
      description: "Philanthropic tuition waivers and leadership scholarships at Kigali campus.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/admissions`,
      itemType: "scholarship",
      rawData: { static: true },
    });
  }
  return results;
}

// ── Kepler / MK Scholars ──

async function scrapeKepler(): Promise<ScrapedResult[]> {
  const base = "https://mkscholars.org";
  const html = await fetchHtml(`${base}/apply`);
  const results: ScrapedResult[] = [
    {
      source: "Kepler / MK Scholars",
      sourceUrl: base,
      title: "Iteme Rwanda Program — Cohort 2026",
      description: "Specialized preparatory funding paths for vulnerable high school graduates entering university.",
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
      description: "Fully funded master's degree program in partnership with Arizona State University.",
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
      results.push({
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
  return results;
}

// ── UGHE ──

async function scrapeUGHE(): Promise<ScrapedResult[]> {
  const base = "https://ughe.org";
  const html = await fetchHtml(`${base}/admissions`);
  const results: ScrapedResult[] = [];
  if (html) {
    const links = extractLinks(html, /scholarship|fellowship|admission|apply|global.health/i);
    for (const link of links.slice(0, 6)) {
      if (link.text.length < 8) continue;
      results.push({
        source: "University of Global Health Equity (UGHE)",
        sourceUrl: absoluteUrl(base, link.href),
        title: link.text,
        description: "Opportunity from UGHE.",
        country: "Rwanda",
        category: "Scholarships",
        applyLink: absoluteUrl(base, link.href),
        itemType: "scholarship",
        rawData: { href: link.href },
      });
    }
  }
  if (!results.length) {
    results.push({
      source: "University of Global Health Equity (UGHE)",
      sourceUrl: `${base}/admissions`,
      title: "UGHE — Global Health Scholarships & Fellowships",
      description: "Fully funded master's degree programs in global health delivery.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/admissions`,
      itemType: "scholarship",
      rawData: { static: true },
    });
  }
  return results;
}

// ── University of Kigali (UoK) ──

async function scrapeUoK(): Promise<ScrapedResult[]> {
  const base = "https://uok.ac.rw";
  const html = await fetchHtml(`${base}/admissions`);
  const results: ScrapedResult[] = [];
  if (html) {
    const links = extractLinks(html, /scholarship|admission|apply|finance|fee/i);
    for (const link of links.slice(0, 6)) {
      if (link.text.length < 8) continue;
      results.push({
        source: "University of Kigali (UoK)",
        sourceUrl: absoluteUrl(base, link.href),
        title: link.text,
        description: "Opportunity from the University of Kigali.",
        country: "Rwanda",
        category: "Scholarships",
        applyLink: absoluteUrl(base, link.href),
        itemType: "scholarship",
        rawData: { href: link.href },
      });
    }
  }
  if (!results.length) {
    results.push({
      source: "University of Kigali (UoK)",
      sourceUrl: `${base}/admissions`,
      title: "University of Kigali — Scholarship & Admission Opportunities",
      description: "Undergraduate and postgraduate programs with merit-based and need-based financial aid.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/admissions`,
      itemType: "scholarship",
      rawData: { static: true },
    });
  }
  return results;
}

// ── AUCA ──

async function scrapeAUCA(): Promise<ScrapedResult[]> {
  const base = "https://www.auca.ac.rw";
  const html = await fetchHtml(`${base}/admissions`);
  const results: ScrapedResult[] = [];
  if (html) {
    const links = extractLinks(html, /scholarship|admission|finance|aid/i);
    for (const link of links.slice(0, 6)) {
      if (link.text.length < 8) continue;
      results.push({
        source: "Adventist University of Central Africa (AUCA)",
        sourceUrl: absoluteUrl(base, link.href),
        title: link.text,
        description: "Opportunity from AUCA.",
        country: "Rwanda",
        category: "Scholarships",
        applyLink: absoluteUrl(base, link.href),
        itemType: "scholarship",
        rawData: { href: link.href },
      });
    }
  }
  if (!results.length) {
    results.push({
      source: "Adventist University of Central Africa (AUCA)",
      sourceUrl: `${base}/admissions`,
      title: "AUCA — Scholarship & Financial Aid Programs",
      description: "Undergraduate programs with scholarship and financial aid packages.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/admissions`,
      itemType: "scholarship",
      rawData: { static: true },
    });
  }
  return results;
}

// ── ULK ──

async function scrapeULK(): Promise<ScrapedResult[]> {
  const base = "https://ulk.ac.rw";
  const html = await fetchHtml(`${base}/admissions`);
  const results: ScrapedResult[] = [];
  if (html) {
    const links = extractLinks(html, /scholarship|admission|fee|finance/i);
    for (const link of links.slice(0, 6)) {
      if (link.text.length < 8) continue;
      results.push({
        source: "Kigali Independent University (ULK)",
        sourceUrl: absoluteUrl(base, link.href),
        title: link.text,
        description: "Opportunity from ULK.",
        country: "Rwanda",
        category: "Scholarships",
        applyLink: absoluteUrl(base, link.href),
        itemType: "scholarship",
        rawData: { href: link.href },
      });
    }
  }
  if (!results.length) {
    results.push({
      source: "Kigali Independent University (ULK)",
      sourceUrl: `${base}/admissions`,
      title: "ULK — Scholarship & Tuition Assistance Opportunities",
      description: "Undergraduate and graduate programs with tuition assistance and merit-based scholarships.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/admissions`,
      itemType: "scholarship",
      rawData: { static: true },
    });
  }
  return results;
}

// ── Rwanda Polytechnic ──

async function scrapeRwandaPolytechnic(): Promise<ScrapedResult[]> {
  const base = "https://rp.ac.rw";
  const html = await fetchHtml(`${base}/admissions`);
  const results: ScrapedResult[] = [];
  if (html) {
    const links = extractLinks(html, /scholarship|admission|tvet|apply/i);
    for (const link of links.slice(0, 6)) {
      if (link.text.length < 8) continue;
      results.push({
        source: "Rwanda Polytechnic",
        sourceUrl: absoluteUrl(base, link.href),
        title: link.text,
        description: "Opportunity from Rwanda Polytechnic.",
        country: "Rwanda",
        category: "Scholarships",
        applyLink: absoluteUrl(base, link.href),
        itemType: "scholarship",
        rawData: { href: link.href },
      });
    }
  }
  if (!results.length) {
    results.push({
      source: "Rwanda Polytechnic",
      sourceUrl: `${base}/admissions`,
      title: "Rwanda Polytechnic — TVET Scholarship Opportunities",
      description: "Competency-based TVET programs with government-sponsored scholarships.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/admissions`,
      itemType: "scholarship",
      rawData: { static: true },
    });
  }
  return results;
}

// ── INES-Ruhengeri ──

async function scrapeINES(): Promise<ScrapedResult[]> {
  const base = "https://ines.ac.rw";
  const html = await fetchHtml(`${base}/admissions`);
  const results: ScrapedResult[] = [];
  if (html) {
    const links = extractLinks(html, /scholarship|admission|bourse|finance/i);
    for (const link of links.slice(0, 6)) {
      if (link.text.length < 8) continue;
      results.push({
        source: "INES-Ruhengeri",
        sourceUrl: absoluteUrl(base, link.href),
        title: link.text,
        description: "Opportunity from INES-Ruhengeri.",
        country: "Rwanda",
        category: "Scholarships",
        applyLink: absoluteUrl(base, link.href),
        itemType: "scholarship",
        rawData: { href: link.href },
      });
    }
  }
  if (!results.length) {
    results.push({
      source: "INES-Ruhengeri",
      sourceUrl: `${base}/admissions`,
      title: "INES-Ruhengeri — Scholarship & Admission Programs",
      description: "Undergraduate and graduate programs with scholarship and financial aid packages.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/admissions`,
      itemType: "scholarship",
      rawData: { static: true },
    });
  }
  return results;
}

// ── Bridge2Rwanda ──

async function scrapeBridge2Rwanda(): Promise<ScrapedResult[]> {
  const base = "https://bridge2rwanda.org";
  const html = await fetchHtml(`${base}/programs`);
  const results: ScrapedResult[] = [];
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
  if (!results.length) {
    results.push({
      source: "Bridge2Rwanda",
      sourceUrl: base,
      title: "Bridge2Rwanda Isomo Academy — 2026 Applications Open",
      description: "Gap-year program training top-performing Rwandan youth for international university funding.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/apply`,
      itemType: "scholarship",
      rawData: { static: true },
    });
  }
  return results;
}

// ── Friends of Rwandan Education ──

async function scrapeFriendsOfRwanda(): Promise<ScrapedResult[]> {
  const base = "https://friendsofrwandaneducation.org";
  const html = await fetchHtml(`${base}/scholarships`);
  const results: ScrapedResult[] = [];
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
  if (!results.length) {
    results.push({
      source: "Friends of Rwandan Education",
      sourceUrl: `${base}/scholarships`,
      title: "Friends of Rwandan Education — Need-Based Scholarship",
      description: "Need-based financial aid and academic merit awards for students of Rwandan descent.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${base}/apply`,
      itemType: "scholarship",
      rawData: { static: true },
    });
  }
  return results;
}

// ── AIMS Rwanda ──

async function scrapeAIMS(): Promise<ScrapedResult[]> {
  const base = "https://aims.ac.rw";
  return [{
    source: "AIMS Rwanda",
    sourceUrl: `${base}/admissions`,
    title: "AIMS Master's in Mathematical Sciences — Fully Funded Fellowship",
    description: "Prestigious, fully funded Structured Master's Degrees in Mathematical Sciences. Covers full tuition, accommodation, health insurance, and monthly living stipends.",
    country: "Rwanda",
    category: "Scholarships",
    applyLink: `${base}/admissions/apply`,
    itemType: "scholarship",
    rawData: { static: true },
  }];
}

// ── Additional Rwanda Universities ──

const extraUniversityConfigs = [
  { name: "University of Kibungo (UNIK)", base: "https://unik.ac.rw" },
  { name: "Kibogora Polytechnic", base: "https://kp.ac.rw" },
  { name: "Protestant Institute of Arts and Social Sciences (PIASS)", base: "https://piass.ac.rw" },
  { name: "Institut Catholique de Kabgayi (ICK)", base: "https://ick.ac.rw" },
  { name: "Institut d'Enseignement Supérieur de Gitwe (IESG)", base: "https://iesg.ac.rw" },
  { name: "Davis College Akilah Campus", base: "https://daviscollege.edu.rw" },
  { name: "Rwanda Institute for Conservation Agriculture (RICA)", base: "https://www.rica.rw" },
];

async function scrapeExtraUniversity(config: { name: string; base: string }): Promise<ScrapedResult[]> {
  const html = await fetchHtml(`${config.base}/admissions`);
  const results: ScrapedResult[] = [];
  if (html) {
    const links = extractLinks(html, /scholarship|admission|bourse|finance|apply/i);
    for (const link of links.slice(0, 6)) {
      if (link.text.length < 8) continue;
      results.push({
        source: config.name,
        sourceUrl: absoluteUrl(config.base, link.href),
        title: link.text,
        description: `Opportunity from ${config.name}.`,
        country: "Rwanda",
        category: "Scholarships",
        applyLink: absoluteUrl(config.base, link.href),
        itemType: "scholarship",
        rawData: { href: link.href },
      });
    }
  }
  if (!results.length) {
    results.push({
      source: config.name,
      sourceUrl: `${config.base}/admissions`,
      title: `${config.name} — Scholarship & Admission Opportunities`,
      description: "Programs with available financial aid and scholarship packages.",
      country: "Rwanda",
      category: "Scholarships",
      applyLink: `${config.base}/admissions`,
      itemType: "scholarship",
      rawData: { static: true },
    });
  }
  return results;
}

export const universityScrapers: ScraperConfig[] = [
  { name: "University of Rwanda", category: "university", country: "Rwanda", enabled: true, priority: 1, fn: scrapeUR },
  { name: "CMU-Africa", category: "university", country: "Rwanda", enabled: true, priority: 1, fn: scrapeCMUAfrica },
  { name: "ALU Rwanda", category: "university", country: "Rwanda", enabled: true, priority: 1, fn: scrapeALU },
  { name: "Kepler / MK Scholars", category: "university", country: "Rwanda", enabled: true, priority: 1, fn: scrapeKepler },
  { name: "UGHE", category: "university", country: "Rwanda", enabled: true, priority: 1, fn: scrapeUGHE },
  { name: "University of Kigali (UoK)", category: "university", country: "Rwanda", enabled: true, priority: 2, fn: scrapeUoK },
  { name: "AUCA", category: "university", country: "Rwanda", enabled: true, priority: 2, fn: scrapeAUCA },
  { name: "ULK", category: "university", country: "Rwanda", enabled: true, priority: 2, fn: scrapeULK },
  { name: "Rwanda Polytechnic", category: "university", country: "Rwanda", enabled: true, priority: 1, fn: scrapeRwandaPolytechnic },
  { name: "INES-Ruhengeri", category: "university", country: "Rwanda", enabled: true, priority: 2, fn: scrapeINES },
  { name: "Bridge2Rwanda", category: "university", country: "Rwanda", enabled: true, priority: 1, fn: scrapeBridge2Rwanda },
  { name: "Friends of Rwandan Education", category: "university", country: "Rwanda", enabled: true, priority: 2, fn: scrapeFriendsOfRwanda },
  { name: "AIMS Rwanda", category: "university", country: "Rwanda", enabled: true, priority: 1, fn: scrapeAIMS },
  ...extraUniversityConfigs.map((cfg) => ({
    name: cfg.name,
    category: "university" as const,
    country: "Rwanda" as const,
    enabled: true,
    priority: 3,
    fn: () => scrapeExtraUniversity(cfg),
  })),
];