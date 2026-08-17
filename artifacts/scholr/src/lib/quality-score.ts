export interface QualityIssue {
  check: string;
  status: "pass" | "warn" | "fail";
  message: string;
  recommendation?: string;
}

export interface QualityResult {
  score: number;
  issues: QualityIssue[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeQuality(item: Record<string, any>): QualityResult {
  const issues: QualityIssue[] = [];
  let score = 0;

  const pass = (check: string, message: string) =>
    issues.push({ check, status: "pass", message });
  const warn = (check: string, message: string, recommendation?: string) =>
    issues.push({ check, status: "warn", message, recommendation });
  const fail = (check: string, message: string, recommendation?: string) =>
    issues.push({ check, status: "fail", message, recommendation });

  // Title — 15 pts
  const title: string = item.title ?? "";
  if (title.length >= 10 && title.length <= 200) {
    score += 15;
    pass("title", "Title is well-formed");
  } else if (title.length > 0) {
    score += 7;
    warn("title", "Title may be too short or long", "Aim for 10–200 characters");
  } else {
    fail("title", "No title found", "Add a descriptive title");
  }

  // Description — 10 pts
  const desc: string = item.description ?? "";
  if (desc.length > 100) {
    score += 10;
    pass("description", "Description is present");
  } else if (desc.length > 0) {
    score += 5;
    warn("description", "Description is too short", "Expand to at least 100 characters");
  } else {
    fail("description", "No description", "Add a concise summary of the opportunity");
  }

  // Content — 20 pts
  const contentLen: number = (item.plainText ?? item.plain_text ?? "").length;
  if (contentLen > 500) {
    score += 20;
    pass("content", `Rich content available (${contentLen.toLocaleString()} chars)`);
  } else if (contentLen > 100) {
    score += 10;
    warn("content", "Content is thin", "Re-enrich or manually add more content");
  } else {
    fail("content", "No content extracted", "Re-enrich from source or manually add content");
  }

  // Cover image — 15 pts
  const cover: string = item.coverImage ?? item.cover_image ?? "";
  if (cover) {
    score += 15;
    pass("cover_image", "Cover image available");
  } else {
    fail("cover_image", "No cover image", "Select an image from the gallery or upload a placeholder");
  }

  // Apply link — 15 pts
  const applyLink: string = item.applyLink ?? item.apply_link ?? "";
  if (applyLink.startsWith("http")) {
    score += 15;
    pass("apply_link", "Application link is present");
  } else {
    fail("apply_link", "No valid application link", "Add the official application URL");
  }

  // Deadline — 10 pts
  const deadline: string = item.deadline ?? "";
  if (deadline) {
    score += 10;
    pass("deadline", `Deadline: ${deadline}`);
  } else {
    warn("deadline", "No deadline found", "Check the source page for the application deadline");
  }

  // Country — 5 pts
  const country: string = item.country ?? "";
  if (country) {
    score += 5;
    pass("location", `Country: ${country}`);
  } else {
    warn("location", "No country specified", "Add the host country");
  }

  // Category — 5 pts
  const category: string = item.category ?? "";
  if (category) {
    score += 5;
    pass("category", `Category: ${category}`);
  } else {
    warn("category", "No category assigned", "Select an appropriate category");
  }

  // Gallery — 5 pts
  const images: unknown[] = item.images ?? [];
  if (images.length > 0) {
    score += 5;
    pass("gallery", `${images.length} image(s) available`);
  } else {
    warn("gallery", "No gallery images", "Images significantly improve engagement");
  }

  return { score, issues };
}

export function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-500";
}

export function scoreBg(score: number) {
  if (score >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-600 border-red-200";
}

export function scoreLabel(score: number) {
  if (score >= 75) return "High quality";
  if (score >= 50) return "Needs work";
  return "Incomplete";
}

export const STATUS_META: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  pending:              { label: "Needs Review",     color: "bg-orange-100 text-orange-700",  dot: "bg-orange-400" },
  needs_review:         { label: "Needs Review",     color: "bg-orange-100 text-orange-700",  dot: "bg-orange-400" },
  needs_images:         { label: "Needs Images",     color: "bg-yellow-100 text-yellow-700",  dot: "bg-yellow-400" },
  needs_metadata:       { label: "Needs Metadata",   color: "bg-yellow-100 text-yellow-700",  dot: "bg-yellow-400" },
  needs_verification:   { label: "Needs Verification", color: "bg-sky-100 text-sky-700",      dot: "bg-sky-400" },
  enriching:            { label: "Enriching",         color: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
  enriched:             { label: "Enriched",          color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400" },
  scheduled:            { label: "Scheduled",         color: "bg-purple-100 text-purple-700", dot: "bg-purple-400" },
  approved:             { label: "Published",         color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  published:            { label: "Published",         color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  archived:             { label: "Archived",          color: "bg-gray-100 text-gray-600",     dot: "bg-gray-400" },
  expired:              { label: "Expired",           color: "bg-gray-100 text-gray-500",     dot: "bg-gray-300" },
  rejected:             { label: "Rejected",          color: "bg-red-100 text-red-600",       dot: "bg-red-400" },
};
