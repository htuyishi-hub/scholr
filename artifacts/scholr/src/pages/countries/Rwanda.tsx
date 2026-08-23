import React from "react";
import Meta, { defaultOrganizationJsonLd } from "../../components/seo/Meta";
import Breadcrumb, { breadcrumbJsonLd } from "../../components/Breadcrumb";

const url = "https://scholr.ink/countries/rwanda";

export default function RwandaCountry({ scholarships = [] as any[] }) {
  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Scholarships", url: "/scholarships" },
    { name: "Rwanda", url },
  ];

  const jsonLd = [defaultOrganizationJsonLd("https://scholr.ink"), breadcrumbJsonLd(crumbs)];

  return (
    <main>
      <Meta
        title="Scholarships in Rwanda 2026 | scholr"
        description="Comprehensive list of scholarships in Rwanda for undergraduate and graduate students, including fully funded and government-funded opportunities with application links and deadlines."
        canonical={url}
        jsonLd={jsonLd}
      />

      <Breadcrumb items={crumbs} />

      <h1>Scholarships in Rwanda</h1>

      <section>
        <h2>Latest scholarships</h2>
        <ul>
          {scholarships.map((s) => (
            <li key={s.slug}>
              <a href={`/opportunity/${s.slug}`}>{s.title}</a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
