import React from "react";

type QuickFactsProps = {
  host?: { name: string; url?: string };
  country?: { name: string; url?: string };
  deadline?: string | null;
  level?: string;
  funding?: string;
  applyLink?: string;
};

export default function QuickFacts({ host, country, deadline, level, funding, applyLink }: QuickFactsProps) {
  return (
    <aside className="bg-card border border-border p-6 rounded-2xl mb-8" aria-labelledby="quick-facts-heading">
      <h2 id="quick-facts-heading" className="text-xl font-bold font-serif mb-6">Quick Facts</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
        {host && (
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Host institution</dt>
            <dd className="font-semibold text-foreground text-lg">{host.url ? <a href={host.url} className="hover:text-primary transition-colors hover:underline">{host.name}</a> : host.name}</dd>
          </div>
        )}
        {country && (
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Country</dt>
            <dd className="font-semibold text-foreground text-lg">{country.url ? <a href={country.url} className="hover:text-primary transition-colors hover:underline">{country.name}</a> : country.name}</dd>
          </div>
        )}
        {level && (
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Study level</dt>
            <dd className="font-semibold text-foreground text-lg capitalize">{level}</dd>
          </div>
        )}
        {funding && (
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Funding</dt>
            <dd className="font-semibold text-foreground text-lg capitalize">{funding}</dd>
          </div>
        )}
        {deadline !== undefined && (
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Deadline</dt>
            <dd className="font-semibold text-foreground text-lg">{deadline ?? "Rolling / Open"}</dd>
          </div>
        )}
        {applyLink && (
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Application</dt>
            <dd className="font-semibold text-foreground text-lg">
              <a href={applyLink} className="text-primary hover:underline font-bold inline-flex items-center gap-1" rel="noopener noreferrer" target="_blank">
                Apply now <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
            </dd>
          </div>
        )}
      </dl>
    </aside>
  );
}
