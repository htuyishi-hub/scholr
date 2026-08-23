import React from "react";

type Crumb = { name: string; url?: string };

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((it, i) => (
          <li key={i} className="breadcrumb-item">
            {it.url ? <a href={it.url}>{it.name}</a> : <span>{it.name}</span>}
            {i < items.length - 1 && <span aria-hidden> › </span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function breadcrumbJsonLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
