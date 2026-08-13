import { useEffect } from "react";

export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://scholr.ink").replace(/\/+$/, "");
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/opengraph.jpg`;

function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}/${value.replace(/^\/+/, "")}`;
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

function upsertJsonLd(value: Record<string, unknown> | null) {
  const id = "scholr-seo-jsonld";
  let element = document.head.querySelector<HTMLScriptElement>(`script#${id}`);
  if (!value) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("script");
    element.id = id;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(value);
}

export interface SeoProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  jsonLd?: Record<string, unknown> | null;
  noindex?: boolean;
}

export function Seo({
  title,
  description,
  path = "/",
  image = DEFAULT_SOCIAL_IMAGE,
  imageWidth = 1280,
  imageHeight = 720,
  type = "website",
  publishedTime,
  modifiedTime,
  jsonLd,
  noindex = false,
}: SeoProps) {
  useEffect(() => {
    const canonical = absoluteUrl(path);
    const imageUrl = absoluteUrl(image);

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large");
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", "scholr");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:image:width", String(imageWidth));
    upsertMeta("property", "og:image:height", String(imageHeight));
    upsertMeta("property", "og:image:type", "image/jpeg");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);
    upsertLink("canonical", canonical);

    const existingPublished = document.head.querySelector('meta[property="article:published_time"]');
    const existingModified = document.head.querySelector('meta[property="article:modified_time"]');
    if (publishedTime) upsertMeta("property", "article:published_time", publishedTime);
    else existingPublished?.remove();
    if (modifiedTime) upsertMeta("property", "article:modified_time", modifiedTime);
    else existingModified?.remove();

    upsertJsonLd(jsonLd ?? null);
  }, [description, image, imageHeight, imageWidth, jsonLd, modifiedTime, noindex, path, publishedTime, title, type]);

  return null;
}

export function toAbsoluteUrl(value?: string | null) {
  return value ? absoluteUrl(value) : DEFAULT_SOCIAL_IMAGE;
}

export function cleanDescription(value: string | null | undefined, fallback: string) {
  const cleaned = (value || fallback).replace(/[*_#`]/g, "").replace(/\s+/g, " ").trim();
  return cleaned.length > 160 ? `${cleaned.slice(0, 157).replace(/\s+\S*$/, "")}...` : cleaned;
}