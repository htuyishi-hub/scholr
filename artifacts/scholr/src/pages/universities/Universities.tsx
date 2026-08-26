import React from "react";
import Meta, { defaultOrganizationJsonLd } from "../../components/seo/Meta";
import Breadcrumb, { breadcrumbJsonLd } from "../../components/Breadcrumb";

const url = "https://scholr.ink/universities";

export default function Universities() {
  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Universities", url },
  ];

  const jsonLd = [defaultOrganizationJsonLd("https://scholr.ink"), breadcrumbJsonLd(crumbs)];

  return (
    <main>
      <Meta
        title="Universities in Rwanda | scholr"
        description="Browse scholarship and funding opportunities for universities and colleges in Rwanda, including University of Rwanda and Rwanda Polytechnic."
        canonical={url}
        jsonLd={jsonLd}
      />

      <Breadcrumb items={crumbs} />

      <h1>Universities in Rwanda</h1>
      <section>
        <p>
          Discover scholarships, grants, and funding opportunities for students at Rwanda’s leading public and
          private institutions.
        </p>
      </section>

      <section>
        <h2>Popular institutions</h2>
        <ul>
          <li>
            <a href="/universities/university-of-rwanda">University of Rwanda</a>
          </li>
          <li>
            <a href="/universities/rwanda-polytechnic">Rwanda Polytechnic</a>
          </li>
        </ul>
      </section>
    </main>
  );
}
