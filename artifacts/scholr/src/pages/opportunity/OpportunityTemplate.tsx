import React from "react";
import Meta, { defaultOrganizationJsonLd } from "../../components/seo/Meta";
import Breadcrumb, { breadcrumbJsonLd } from "../../components/Breadcrumb";
import QuickFacts from "../../components/QuickFacts";

function renderList(items: Array<string | { question?: string; answer?: string }> | undefined | null) {
  if (!items || items.length === 0) return null;

  return (
    <ul className="list-disc pl-5 space-y-2">
      {items.map((item, index) => {
        if (typeof item === "string") return <li key={index}>{item}</li>;
        if (item && item.question && item.answer) return <li key={index}><strong>{item.question}:</strong> {item.answer}</li>;
        return null;
      })}
    </ul>
  );
}

export default function OpportunityTemplate({ opportunity }: { opportunity: any }) {
  const url = `https://scholr.ink/opportunity/${opportunity.slug}`;
  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Scholarships", url: "/scholarships" },
    { name: opportunity.country?.name || "Country", url: opportunity.country?.url },
    { name: opportunity.host?.name || "Host", url: opportunity.host?.url },
    { name: opportunity.title, url },
  ];

  const sections = [
    opportunity.overview ? { title: "Overview", body: <div dangerouslySetInnerHTML={{ __html: opportunity.overview }} /> } : null,
    opportunity.responsibilities?.length ? { title: "Responsibilities", body: renderList(opportunity.responsibilities) } : null,
    opportunity.eligibility?.length ? { title: "Eligibility", body: renderList(opportunity.eligibility) } : null,
    opportunity.requirements?.length ? { title: "Requirements", body: renderList(opportunity.requirements) } : null,
    opportunity.benefits?.length ? { title: "Benefits", body: renderList(opportunity.benefits) } : null,
    opportunity.applicationProcess?.length ? { title: "Application process", body: renderList(opportunity.applicationProcess) } : null,
    opportunity.importantDates?.length ? { title: "Important dates", body: renderList(opportunity.importantDates.map((date: any) => `${date.label}${date.date ? `: ${date.date}` : ""}${date.note ? ` — ${date.note}` : ""}`)) } : null,
    opportunity.faq?.length ? { title: "FAQ", body: renderList(opportunity.faq) } : null,
    opportunity.contact ? { title: "Contact", body: <div>{opportunity.contact.institution && <p>{opportunity.contact.institution}</p>}{opportunity.contact.department && <p>{opportunity.contact.department}</p>}{opportunity.contact.email && <p>{opportunity.contact.email}</p>}</div> } : null,
  ].filter(Boolean);

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

      {sections.map((section: any) => (
        <section key={section.title} className="mt-8">
          <h2>{section.title}</h2>
          {section.body}
        </section>
      ))}
    </article>
  );
}
