import React from "react";
import Meta, { defaultOrganizationJsonLd } from "../../components/seo/Meta";
import Breadcrumb, { breadcrumbJsonLd } from "../../components/Breadcrumb";
import QuickFacts from "../../components/QuickFacts";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

function renderList(items: Array<string | { question?: string; answer?: string }> | undefined | null) {
  if (!items || items.length === 0) return null;

  return (
    <ul className="list-disc pl-5 space-y-2">
      {items.map((item, index) => {
        if (typeof item === "string") return <li key={index}>{item}</li>;
        if (item && item.question && item.answer) return <li key={index} className="mb-4"><strong className="block mb-1">{item.question}</strong>{item.answer}</li>;
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
    opportunity.overview ? { title: "Overview", body: <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: opportunity.overview.replace(/\n/g, '<br />') }} /> } : null,
    opportunity.responsibilities?.length ? { title: "What You'll Do", body: renderList(opportunity.responsibilities) } : null,
    opportunity.eligibility?.length ? { title: "Eligibility", body: renderList(opportunity.eligibility) } : null,
    opportunity.requirements?.length ? { title: "Requirements", body: renderList(opportunity.requirements) } : null,
    (opportunity.benefits?.length || opportunity.fundingDetails) ? { title: "Benefits & Funding", body: 
      <div className="space-y-4">
        {opportunity.fundingDetails && (
          <div className="bg-muted p-4 rounded-xl space-y-1">
            {opportunity.fundingDetails.status && <p><strong>Status:</strong> {opportunity.fundingDetails.status}</p>}
            {opportunity.fundingDetails.amount && <p><strong>Amount:</strong> {opportunity.fundingDetails.amount} {opportunity.fundingDetails.currency}</p>}
            {opportunity.fundingDetails.frequency && <p><strong>Frequency:</strong> {opportunity.fundingDetails.frequency}</p>}
            {opportunity.fundingDetails.description && <p>{opportunity.fundingDetails.description}</p>}
          </div>
        )}
        {renderList(opportunity.benefits)}
      </div> 
    } : null,
    opportunity.requiredDocuments?.length ? { title: "Required Documents", body: renderList(opportunity.requiredDocuments.map((d: any) => `${d.name}${d.description ? `: ${d.description}` : ""}`)) } : null,
    opportunity.applicationProcess?.length ? { title: "Application Process", body: renderList(opportunity.applicationProcess) } : null,
    opportunity.importantDates?.length ? { title: "Important Dates", body: renderList(opportunity.importantDates.map((date: any) => `${date.label}${date.date ? `: ${date.date}` : ""}${date.note ? ` — ${date.note}` : ""}`)) } : null,
    (opportunity.location || opportunity.workMode) ? { title: "Location & Work Mode", body: 
      <ul className="list-disc pl-5 space-y-2">
        {opportunity.location && <li><strong>Location:</strong> {opportunity.location}</li>}
        {opportunity.workMode && <li><strong>Work Mode:</strong> {opportunity.workMode.replace('_', ' ')}</li>}
      </ul>
    } : null,
    opportunity.internationalStudentInfo ? { title: "International Student Information", body: <p>{opportunity.internationalStudentInfo}</p> } : null,
    opportunity.faq?.length ? { title: "FAQ", body: renderList(opportunity.faq) } : null,
    opportunity.contact ? { title: "Contact", body: 
      <div className="bg-muted p-4 rounded-xl space-y-1">
        {opportunity.contact.institution && <p><strong>Institution:</strong> {opportunity.contact.institution}</p>}
        {opportunity.contact.department && <p><strong>Department:</strong> {opportunity.contact.department}</p>}
        {opportunity.contact.email && <p><strong>Email:</strong> <a href={`mailto:${opportunity.contact.email}`} className="text-primary hover:underline">{opportunity.contact.email}</a></p>}
      </div> 
    } : null,
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
    <article className="max-w-4xl mx-auto px-4 py-8">
      <Meta title={`${opportunity.title} | ${opportunity.host?.name || "scholr"}`} description={opportunity.summary} canonical={url} jsonLd={jsonLd} />
      <Breadcrumb items={crumbs} />
      
      {/* Hero */}
      {opportunity.coverImage && (
        <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 mt-4">
          <img src={opportunity.coverImage} alt={opportunity.title} className="w-full h-full object-cover" />
        </div>
      )}
      <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground mt-4 mb-6">{opportunity.title}</h1>
      
      {/* Quick Facts */}
      <QuickFacts
        host={opportunity.host}
        country={opportunity.country}
        deadline={opportunity.deadline}
        level={opportunity.level}
        funding={opportunity.funding}
        applyLink={opportunity.applyLink}
      />

      <div className="space-y-12 mt-12">
        {sections.map((section: any) => (
          <section key={section.title} className="space-y-4">
            <h2 className="text-2xl font-bold font-serif">{section.title}</h2>
            <div className="text-muted-foreground leading-relaxed">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      {/* Apply CTA */}
      {opportunity.applyLink && (
        <div className="mt-16 text-center bg-card border border-border p-8 rounded-2xl shadow-sm">
          <h3 className="text-xl font-bold mb-4">Ready to Apply?</h3>
          <Button asChild size="lg" className="rounded-xl px-8 h-12 text-base gap-2">
            <a href={opportunity.applyLink} target="_blank" rel="noopener noreferrer">
              Apply Now <ExternalLink size={18} />
            </a>
          </Button>
        </div>
      )}
    </article>
  );
}
