import React from "react";
import Meta, { defaultOrganizationJsonLd } from "../../components/seo/Meta";
import Breadcrumb, { breadcrumbJsonLd } from "../../components/Breadcrumb";

const url = "https://scholr.ink/universities/university-of-rwanda";

export default function UniversityOfRwanda({ scholarships = [] as any[] }) {
  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Universities", url: "/universities" },
    { name: "University of Rwanda", url },
  ];

  const jsonLd = [defaultOrganizationJsonLd("https://scholr.ink"), breadcrumbJsonLd(crumbs)];

  return (
    <main>
      <Meta
        title="University of Rwanda Scholarships 2026 | scholr"
        description="Latest scholarships, grants and funding opportunities for University of Rwanda students. Find undergraduate, postgraduate and fully funded programs with application links and deadlines."
        canonical={url}
        jsonLd={jsonLd}
      />

      <Breadcrumb items={crumbs} />

      <h1>University of Rwanda Scholarships</h1>
      <section>
        <p>
          University of Rwanda (UR) students and alumni can find scholarship listings here. Browse current
          opportunities including fully funded programs and scholarships for undergraduate and postgraduate
          study.
        </p>
      </section>

      <section>
        <h2>Currently active scholarships</h2>
        <ul>
          {scholarships.map((s) => (
            <li key={s.slug}>
              <a href={`/opportunity/${s.slug}`}>{s.title}</a>
              <div>{s.deadline}</div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
