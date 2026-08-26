import React from "react";
import Meta, { defaultOrganizationJsonLd } from "../../components/seo/Meta";
import Breadcrumb, { breadcrumbJsonLd } from "../../components/Breadcrumb";

const url = "https://scholr.ink/universities/rwanda-polytechnic";

export default function RwandaPolytechnic({ scholarships = [] as any[] }) {
  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Universities", url: "/universities" },
    { name: "Rwanda Polytechnic", url },
  ];

  const jsonLd = [defaultOrganizationJsonLd("https://scholr.ink"), breadcrumbJsonLd(crumbs)];

  return (
    <main>
      <Meta
        title="Rwanda Polytechnic Scholarships 2026 | scholr"
        description="Explore Rwanda Polytechnic scholarships, TVET funding, and admissions opportunities for students seeking practical, skills-based study and training in Rwanda."
        canonical={url}
        jsonLd={jsonLd}
      />

      <Breadcrumb items={crumbs} />

      <h1>Rwanda Polytechnic Scholarships</h1>
      <section>
        <p>
          Rwanda Polytechnic is a major part of Rwanda&apos;s technical and vocational training ecosystem, offering
          students pathways into practical careers through TVET programs, skill development initiatives, and
          scholarship-linked admissions opportunities.
        </p>
        <p>
          This page is designed to help students discover current funding, training, and admission pathways related
          to Rwanda Polytechnic programs.
        </p>
      </section>

      <section>
        <h2>Current opportunities</h2>
        {scholarships.length ? (
          <ul>
            {scholarships.map((s) => (
              <li key={s.slug}>
                <a href={`/opportunity/${s.slug}`}>{s.title}</a>
                <div>{s.deadline}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No opportunities are currently listed here, but new admissions and funding routes are added regularly.</p>
        )}
      </section>
    </main>
  );
}
