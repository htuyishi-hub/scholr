/**
 * Scraper orchestrator - combines all source categories and runs them with concurrency limiting.
 * This replaces the old runAllScrapers function in the old scraper.ts.
 */
import pLimit from "p-limit";
import type { ScraperConfig, ScrapedResult, ScraperResult } from "./types.js";
import { universityScrapers } from "./universities.js";
import { governmentScrapers } from "./government.js";
import { providerScrapers } from "./scholarship-providers.js";
import { aggregatorScrapers } from "./aggregators.js";
import { jobScrapers } from "./jobs.js";
import { unNgoScrapers } from "./un-ngos.js";
import { miscScrapers } from "./tech-fellowships.js";

const CONCURRENCY = 8; // max simultaneous requests

const allScrapers: ScraperConfig[] = [
  ...universityScrapers,
  ...governmentScrapers,
  ...providerScrapers,
  ...aggregatorScrapers,
  ...jobScrapers,
  ...unNgoScrapers,
  ...miscScrapers,
];

export interface RunSummary {
  totalSources: number;
  enabledSources: number;
  totalResults: number;
  scraperResults: ScraperResult[];
  durationMs: number;
  errors: string[];
}

export async function runAllScrapers(): Promise<{
  results: ScrapedResult[];
  summary: RunSummary;
}> {
  const start = Date.now();
  const errors: string[] = [];
  const scraperResults: ScraperResult[] = [];
  const results: ScrapedResult[] = [];

  // Filter to enabled scrapers and sort by priority
  const enabled = allScrapers
    .filter((s) => s.enabled)
    .sort((a, b) => a.priority - b.priority);

  const limit = pLimit(CONCURRENCY);

  const tasks = enabled.map((scraper) =>
    limit(async () => {
      const t0 = Date.now();
      try {
        const items = await scraper.fn();
        const duration = Date.now() - t0;
        scraperResults.push({
          name: scraper.name,
          count: items.length,
          duration,
          success: true,
        });
        return items;
      } catch (err) {
        const duration = Date.now() - t0;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`[${scraper.name}] ${msg}`);
        scraperResults.push({
          name: scraper.name,
          count: 0,
          duration,
          success: false,
          error: msg,
        });
        return [] as ScrapedResult[];
      }
    })
  );

  const nested = await Promise.all(tasks);
  for (const items of nested) {
    results.push(...items);
  }

  return {
    results,
    summary: {
      totalSources: allScrapers.length,
      enabledSources: enabled.length,
      totalResults: results.length,
      scraperResults,
      durationMs: Date.now() - start,
      errors,
    },
  };
}

// Re-exports
export { type ScraperConfig, type ScrapedResult, type ScraperConfig as ScraperSource } from "./types.js";
export { universityScrapers } from "./universities.js";
export { governmentScrapers } from "./government.js";
export { providerScrapers } from "./scholarship-providers.js";
export { aggregatorScrapers } from "./aggregators.js";
export { jobScrapers } from "./jobs.js";
export { unNgoScrapers } from "./un-ngos.js";
export { miscScrapers } from "./tech-fellowships.js";

/**
 * Get total count of configured scraper sources.
 */
export function getSourceCount(): number {
  return allScrapers.length;
}

/**
 * Get scrapers grouped by category.
 */
export function getScrapersByCategory(): Record<string, ScraperConfig[]> {
  const grouped: Record<string, ScraperConfig[]> = {};
  for (const scraper of allScrapers) {
    const cat = scraper.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(scraper);
  }
  return grouped;
}
