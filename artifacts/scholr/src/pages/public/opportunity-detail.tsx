import React, { useEffect } from "react";
import { useGetOpportunityBySlug, useIncrementOpportunityViews } from "@workspace/api-client-react";
import OpportunityTemplate from "../opportunity/OpportunityTemplate";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { normalizeOpportunityStructuredData } from "@/lib/opportunity-structure";

export function OpportunityDetail({ slug }: { slug: string }) {
  const { data: opp, isLoading } = useGetOpportunityBySlug(slug, { query: { enabled: !!slug } as any });
  const increment = useIncrementOpportunityViews();

  useEffect(() => {
    if (opp?.id) increment.mutate({ id: opp.id });
  }, [opp?.id]);

  if (isLoading) return <div className="container mx-auto px-4 py-12">Loading…</div>;
  if (!opp)
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Opportunity not found</h1>
        <p className="text-muted-foreground mt-4">This opportunity does not exist or has been removed.</p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/browse">Browse opportunities</Link>
          </Button>
        </div>
      </div>
    );

  const structuredData = normalizeOpportunityStructuredData((opp as any)?.structuredData ?? (opp as any)?.content ?? undefined, opp.title);

  const mappedOpp = {
    slug: opp.slug,
    title: opp.title,
    summary: opp.metaDescription || opp.description || opp.content || "",
    description: opp.content || opp.description || "",
    host: (opp as any).hostOrganization ? { name: String((opp as any).hostOrganization.name || (opp as any).host || ""), url: (opp as any).hostOrganization.url } : { name: (opp as any).host || "" },
    country: opp.country ? { name: opp.country, url: `/countries/${String(opp.country).toLowerCase().replace(/\s+/g, "-")}` } : undefined,
    deadline: opp.deadline || structuredData?.deadline || null,
    level: Array.isArray(opp.studyLevel) ? opp.studyLevel.join(", ") : opp.studyLevel || structuredData?.studyLevels?.join(", ") || undefined,
    funding: opp.fundingType === "full" ? "Fully funded" : opp.fundingType || structuredData?.funding?.status || undefined,
    fundingDetails: structuredData?.funding || undefined,
    applyLink: opp.applyLink || (opp as any).applyUrl || structuredData?.applicationUrl || undefined,
    eligibility: structuredData?.eligibility?.length ? structuredData.eligibility : ((opp as any).eligibility || ""),
    applicationProcess: structuredData?.applicationSteps?.length ? structuredData.applicationSteps : ((opp as any).applicationProcess || (opp as any).howToApply || ""),
    overview: structuredData?.overview || opp.content || opp.description || "",
    responsibilities: structuredData?.responsibilities ?? [],
    requirements: structuredData?.requirements ?? [],
    benefits: structuredData?.benefits ?? [],
    faq: structuredData?.faq ?? [],
    importantDates: structuredData?.importantDates ?? [],
    requiredDocuments: structuredData?.requiredDocuments ?? [],
    location: (opp as any).city ? `${(opp as any).city}${opp.country ? `, ${opp.country}` : ""}` : opp.country || structuredData?.city || structuredData?.country || undefined,
    workMode: structuredData?.workMode || (opp as any).workMode || undefined,
    internationalStudentInfo: structuredData?.internationalStudentInfo || undefined,
    contact: structuredData?.contact ?? null,
    coverImage: opp.coverImage || (opp as any).image || null,
  };

  return <OpportunityTemplate opportunity={mappedOpp} />;
}

export default OpportunityDetail;
