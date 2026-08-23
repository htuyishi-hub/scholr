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
    <aside className="quick-facts" aria-labelledby="quick-facts-heading">
      <h2 id="quick-facts-heading">Quick facts</h2>
      <dl>
        {host && (
          <>
            <dt>Host institution</dt>
            <dd>{host.url ? <a href={host.url}>{host.name}</a> : host.name}</dd>
          </>
        )}
        {country && (
          <>
            <dt>Country</dt>
            <dd>{country.url ? <a href={country.url}>{country.name}</a> : country.name}</dd>
          </>
        )}
        {level && (
          <>
            <dt>Study level</dt>
            <dd>{level}</dd>
          </>
        )}
        {funding && (
          <>
            <dt>Funding</dt>
            <dd>{funding}</dd>
          </>
        )}
        {deadline !== undefined && (
          <>
            <dt>Deadline</dt>
            <dd>{deadline ?? "Rolling / Open"}</dd>
          </>
        )}
        {applyLink && (
          <>
            <dt>Application</dt>
            <dd>
              <a href={applyLink} rel="noopener noreferrer" target="_blank">
                Apply now
              </a>
            </dd>
          </>
        )}
      </dl>
    </aside>
  );
}
