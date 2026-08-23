import React from "react";
import Meta, { defaultOrganizationJsonLd } from "../../components/seo/Meta";
import Breadcrumb, { breadcrumbJsonLd } from "../../components/Breadcrumb";
import QuickFacts from "../../components/QuickFacts";

export default function OpportunityTemplate({ opportunity }: { opportunity: any }) {
  const url = `https://scholr.ink/opportunity/${opportunity.slug}`;
  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Scholarships", url: "/scholarships" },
    { name: opportunity.country?.name || "Country", url: opportunity.country?.url },
    { name: opportunity.host?.name || "Host", url: opportunity.host?.url },
    { name: opportunity.title, url },
  ];

  const jsonLd = [
    defaultOrganizationJsonLd("https://scholr.ink"),
    breadcrumbJsonLd(crumbs),
    {
      "@context": "https://schema.org",
      "@type": "Scholarship",
      name: opportunity.title,
      description: opportunity.summary || opportunity.description,
      url,
      provider: opportunity.host ? { "@type": "CollegeOrUniversity", name: opportunity.host.name, url: opportunity.host.url } : undefined,
      applicationDeadline: opportunity.deadline || undefined,
    },
  ];

  return (
    <article>
      <Meta title={`${opportunity.title} | ${opportunity.host?.name || "scholr"}`} description={opportunity.summary} canonical={url} jsonLd={jsonLd} />
      <Breadcrumb items={crumbs} />
      <h1>{opportunity.title}</h1>
      <QuickFacts
        host={opportunity.host}
        country={opportunity.country}
        deadline={opportunity.deadline}
        level={opportunity.level}
        funding={opportunity.funding}
        applyLink={opportunity.applyLink}
      />

      <section>
        <h2>Overview</h2>
        <div dangerouslySetInnerHTML={{ __html: opportunity.description || "" }} />
      </section>

      <section>
        <h2>Eligibility</h2>
        <div dangerouslySetInnerHTML={{ __html: opportunity.eligibility || "" }} />
      </section>

      <section>
        <h2>Application process</h2>
        <div dangerouslySetInnerHTML={{ __html: opportunity.applicationProcess || "" }} />
      </section>
    </article>
  );
}
