import React from "react";
import { Seo } from "@/components/seo";

type MetaProps = {
  title: string;
  description?: string;
  canonical?: string;
  jsonLd?: any;
};

export default function Meta({ title, description, canonical, jsonLd }: MetaProps) {
  return (
    <Seo title={title} description={description || ""} path={canonical ? new URL(canonical).pathname : "/"} jsonLd={jsonLd} />
  );
}

export function defaultOrganizationJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "scholr",
    url: siteUrl,
  };
}
