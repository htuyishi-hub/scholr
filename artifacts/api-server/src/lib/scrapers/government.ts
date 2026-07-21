/**
 * Rwanda Government & Public Institution scraper sources.
 */
import type { ScraperConfig, ScrapedResult } from "./types.js";
import { fetchHtml, extractLinks, absoluteUrl, scrapeGenericList } from "./types.js";

async function scrapeHEC(): Promise<ScrapedResult[]> {
  return scrapeGenericList(
    "HEC Rwanda",
    "https://hec.gov.rw",
    "/scholarships",
    /scholarship|fellowship|burs/i,
    20,
    "scholarship",
    "HEC Rwanda — Scholarship Opportunities",
    "Scholarship opportunity from the Higher Education Council Rwanda.",
    "Scholarships"
  );
}

export const governmentScrapers: ScraperConfig[] = [
  { name: "HEC Rwanda", category: "government", country: "Rwanda", enabled: true, priority: 1, fn: scrapeHEC },
  { name: "MINEDUC", category: "government", country: "Rwanda", enabled: true, priority: 1, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("Ministry of Education (MINEDUC)", "https://www.mineduc.gov.rw", "/news", /scholarship|bursary|student.loan|admission|applic/i, 10, "scholarship", "MINEDUC — Education Announcements", "Education opportunity from the Ministry of Education Rwanda.", "Scholarships") },
  { name: "REB", category: "government", country: "Rwanda", enabled: true, priority: 1, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("Rwanda Education Board (REB)", "https://reb.rw", "/news", /scholarship|bursary|exam|student|admission/i, 10, "scholarship", "REB — National Examinations & School Announcements", "Official announcements from the Rwanda Education Board.", "Scholarships") },
  { name: "NESA", category: "government", country: "Rwanda", enabled: true, priority: 2, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("National Examination and School Inspection Authority (NESA)", "https://www.nesa.gov.rw", "/news", /exam|scholarship|announce|student/i, 8, "scholarship", "NESA — Official Announcements", "Announcements from NESA.", "Scholarships") },
  { name: "RTB", category: "government", country: "Rwanda", enabled: true, priority: 1, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("Rwanda TVET Board (RTB)", "https://rtb.gov.rw", "/news", /scholarship|tvet|student|training|admission/i, 8, "scholarship", "RTB — TVET Scholarship & Training Programs", "Government-sponsored TVET scholarships.", "Scholarships") },
  { name: "RDB", category: "government", country: "Rwanda", enabled: true, priority: 1, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("Rwanda Development Board (RDB)", "https://rdb.rw", "/careers", /career|job|internship|talent|opportunity/i, 8, "job", "RDB — Careers & Talent Opportunities", "Career, internship, and talent development opportunities.", "Jobs") },
  { name: "MIFOTRA", category: "government", country: "Rwanda", enabled: true, priority: 1, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("Ministry of Public Service & Labour (MIFOTRA)", "https://mifotra.gov.rw", "/news", /job|recruitment|career|employment|internship/i, 10, "job", "MIFOTRA — Public Service Jobs", "Public service job opportunity from MIFOTRA.", "Jobs") },
  { name: "MINICT", category: "government", country: "Rwanda", enabled: true, priority: 2, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("Ministry of ICT & Innovation (MINICT)", "https://minict.gov.rw", "/news", /scholarship|fellowship|ict|innovation|internship|training/i, 8, "scholarship", "MINICT — ICT & Innovation Programs", "ICT opportunity from MINICT.", "Scholarships") },
  { name: "RBC", category: "government", country: "Rwanda", enabled: true, priority: 2, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("Rwanda Biomedical Centre (RBC)", "https://www.rbc.gov.rw", "/careers", /job|career|internship|fellowship|opportunity/i, 8, "job", "RBC — Health Career Opportunities", "Career opportunity from RBC.", "Jobs") },
  { name: "Rwanda Space Agency", category: "government", country: "Rwanda", enabled: true, priority: 2, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("Rwanda Space Agency", "https://space.gov.rw", "/news", /scholarship|fellowship|internship|space|innovation/i, 6, "scholarship", "Rwanda Space Agency — STEM & Innovation Programs", "STEM education and innovation programs.", "Scholarships") },
  { name: "REMA", category: "government", country: "Rwanda", enabled: true, priority: 3, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("Rwanda Environment Management Authority (REMA)", "https://rema.gov.rw", "/careers", /job|career|internship|fellowship|environment/i, 6, "job", "REMA — Environmental Careers", "Environmental career opportunity from REMA.", "Jobs") },
  { name: "BNR", category: "government", country: "Rwanda", enabled: true, priority: 3, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("National Bank of Rwanda (BNR)", "https://www.bnr.rw", "/careers", /job|career|internship|opportunity/i, 6, "job", "BNR — Career Opportunities", "Career opportunity at BNR.", "Jobs") },
  { name: "RSSB", category: "government", country: "Rwanda", enabled: true, priority: 3, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("Rwanda Social Security Board (RSSB)", "https://www.rssb.rw", "/careers", /job|career|internship|opportunity/i, 6, "job", "RSSB — Career Opportunities", "Career opportunity at RSSB.", "Jobs") },
  { name: "City of Kigali", category: "government", country: "Rwanda", enabled: true, priority: 2, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("City of Kigali", "https://www.kigalicity.gov.rw", "/opportunities", /job|career|opportunity|tender|internship/i, 8, "job", "City of Kigali — Opportunities", "Opportunity from the City of Kigali.", "Jobs") },
  { name: "RRA", category: "government", country: "Rwanda", enabled: true, priority: 3, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("Rwanda Revenue Authority (RRA)", "https://www.rra.gov.rw", "/careers", /job|career|internship|opportunity/i, 6, "job", "RRA — Career Opportunities", "Career opportunity at RRA.", "Jobs") },
  { name: "NYC", category: "government", country: "Rwanda", enabled: true, priority: 2, fn: (): Promise<ScrapedResult[]> => scrapeGenericList("National Youth Council (NYC)", "https://www.nyc.gov.rw", "/opportunities", /scholarship|fellowship|youth|internship|opportunity/i, 8, "scholarship", "NYC — Youth Empowerment & Scholarship Programs", "Youth empowerment programs and scholarship announcements.", "Scholarships") },
];
