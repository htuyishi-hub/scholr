export type OpportunityStructuredDocument = {
  name: string;
  description?: string | null;
};

export type OpportunityStructuredFaq = {
  question: string;
  answer: string;
};

export type OpportunityStructuredFunding = {
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
  frequency?: string | null;
  description?: string | null;
};

export type OpportunityStructuredImportantDate = {
  label: string;
  date?: string | null;
  note?: string | null;
};

export type OpportunityStructuredContact = {
  institution?: string | null;
  department?: string | null;
  email?: string | null;
};

export type OpportunityStructuredData = {
  title?: string | null;
  hostInstitution?: string | null;
  country?: string | null;
  city?: string | null;
  studyLevels?: string[] | null;
  deadline?: string | null;
  startDate?: string | null;
  duration?: string | null;
  workMode?: string | null;
  overview?: string | null;
  responsibilities?: string[] | null;
  eligibility?: string[] | null;
  requirements?: string[] | null;
  benefits?: string[] | null;
  funding?: OpportunityStructuredFunding | null;
  requiredDocuments?: OpportunityStructuredDocument[] | null;
  applicationSteps?: string[] | null;
  importantDates?: OpportunityStructuredImportantDate[] | null;
  faq?: OpportunityStructuredFaq[] | null;
  contact?: OpportunityStructuredContact | null;
  applicationUrl?: string | null;
  internationalStudentInfo?: string | null;
};

const LABELED_SECTION_ALIASES: Record<string, string> = {
  overview: "overview",
  about: "overview",
  description: "overview",
  "who can apply": "eligibility",
  eligibility: "eligibility",
  "eligibility criteria": "eligibility",
  "requirements & qualifications": "requirements",
  requirements: "requirements",
  "qualifications": "requirements",
  benefits: "benefits",
  funding: "benefits",
  "financial support": "benefits",
  "required documents": "requiredDocuments",
  documents: "requiredDocuments",
  "application documents": "requiredDocuments",
  "application process": "applicationSteps",
  "how to apply": "applicationSteps",
  "application procedure": "applicationSteps",
  "important dates": "importantDates",
  "key dates": "importantDates",
  timeline: "importantDates",
  faq: "faq",
  "frequently asked questions": "faq",
  contact: "contact",
  "contact information": "contact",
  "what you'll do": "responsibilities",
  "responsibilities": "responsibilities",
  "location": "location",
  "work mode": "workMode",
};

const LIST_PREFIX = /^(?:[-*•]\s*|\d+[.)]\s*)/;

function normalizeWhitespace(value: string): string {
  return value.replace(/\r/g, "").replace(/\s+/g, " ").trim();
}

function normalizeBoolean(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase();
  if (["true", "yes", "y", "available", "open"].includes(cleaned)) return "true";
  if (["false", "no", "n", "not available", "closed"].includes(cleaned)) return "false";
  return cleaned;
}

function slugifyLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function firstMatch(text: string, regex: RegExp): string | null {
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function isLikelySectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const key = slugifyLabel(trimmed.replace(/:$/, ""));
  return Object.prototype.hasOwnProperty.call(LABELED_SECTION_ALIASES, key) || /^\w[\w &/()'-]*:?$/.test(trimmed);
}

function parseListItems(text: string): string[] {
  if (!text) return [];
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items: string[] = [];
  for (const raw of lines) {
    const item = raw.replace(LIST_PREFIX, "").trim();
    if (!item) continue;
    if (item.length > 2) items.push(item.replace(/\s+/g, " ").trim());
  }

  if (items.length) return items;

  return normalizeWhitespace(text)
    .split(/;\s*|\.\s+(?=[A-Z])/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function parseFaqBlocks(text: string): OpportunityStructuredFaq[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const faq: OpportunityStructuredFaq[] = [];
  let currentQ: string | null = null;
  let currentA: string[] = [];

  for (const raw of lines) {
    const qMatch = raw.match(/^(?:Q(?:uestion)?\s*[:\-]\s*|\d+\.\s*)(.+)$/i);
    if (qMatch) {
      if (currentQ) faq.push({ question: currentQ, answer: currentA.join(" ").trim() });
      currentQ = qMatch[1].trim();
      currentA = [];
      continue;
    }

    const aMatch = raw.match(/^(?:A(?:nswer)?\s*[:\-]\s*)(.+)$/i);
    if (aMatch && currentQ) {
      currentA.push(aMatch[1].trim());
      continue;
    }

    if (currentQ) {
      currentA.push(raw);
    }
  }

  if (currentQ) faq.push({ question: currentQ, answer: currentA.join(" ").trim() });
  return faq.filter((entry) => entry.question && entry.answer);
}

function parseImportantDates(text: string): OpportunityStructuredImportantDate[] {
  const items: OpportunityStructuredImportantDate[] = [];
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) {
      if (line.length > 0 && items.length) {
        const last = items[items.length - 1];
        last.note = [last.note, line].filter(Boolean).join(" ");
      }
      continue;
    }

    const label = match[1].trim();
    const value = match[2].trim();
    const dateMatch = value.match(/(\d{4}-\d{2}-\d{2}|\d{4}-\d{2}|\d{4}|[A-Z][a-z]+ \d{1,2}, \d{4}|\d{1,2} [A-Z][a-z]+ \d{4})/);
    items.push({
      label,
      date: dateMatch ? dateMatch[1] : null,
      note: value.replace(dateMatch?.[1] ?? "", "").trim() || null,
    });
  }

  return items.filter((item) => item.label);
}

function parseContact(text: string): OpportunityStructuredContact | null {
  const contact: OpportunityStructuredContact = {};
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) contact.email = emailMatch[0];
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const nonEmailLines = lines.filter((line) => !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(line));
  if (nonEmailLines.length) {
    contact.institution = nonEmailLines[0];
    contact.department = nonEmailLines.slice(1).join(" ") || null;
  }
  return emailMatch || contact.institution ? contact : null;
}

function parseFunding(text: string): OpportunityStructuredFunding | null {
  const value = normalizeWhitespace(text);
  if (!value) return null;

  const amountMatch = value.match(/(?:CHF|USD|EUR|GBP|KES|RWF|USD|CAD|AUD)\s*([0-9][0-9,\.]*)/i);
  const numeric = Number((amountMatch?.[1] ?? "").replace(/,/g, ""));
  const currency = amountMatch ? (value.match(/(CHF|USD|EUR|GBP|KES|RWF|CAD|AUD)/i) ?? [])[1] ?? null : null;
  const status = /fully funded|full funding|stipend|grant/i.test(value)
    ? /fully funded|full funding/i.test(value)
      ? "fully_funded"
      : /stipend/i.test(value)
        ? "stipend"
        : "funded"
    : /partial|scholarship/i.test(value)
      ? "partial"
      : null;

  return {
    status,
    amount: Number.isFinite(numeric) ? numeric : null,
    currency: currency ?? null,
    frequency: /monthly/i.test(value) ? "monthly" : /annual|yearly/i.test(value) ? "annual" : null,
    description: value || null,
  };
}

function parseListLikeSection(text: string): string[] {
  const rows = parseListItems(text);
  return rows.length ? rows : [normalizeWhitespace(text) || ""].filter(Boolean);
}

function parseStructuredSections(rawText: string): Record<string, unknown> {
  const normalized = rawText.replace(/\r/g, "").trim();
  if (!normalized) return {};

  const lines = normalized.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const sections: Record<string, string[]> = {};
  let currentKey: string | null = null;

  for (const rawLine of lines) {
    const headingMatch = rawLine.match(/^([A-Za-z0-9 &/()'-]+)\s*:\s*(.*)$/);
    if (headingMatch) {
      const label = headingMatch[1].trim();
      const key = Object.keys(LABELED_SECTION_ALIASES).find((alias) => slugifyLabel(alias) === slugifyLabel(label));
      const canonical = key ? LABELED_SECTION_ALIASES[key] : null;
      if (canonical) {
        currentKey = canonical;
        const rest = headingMatch[2].trim();
        if (rest) {
          sections[canonical] = sections[canonical] ?? [];
          sections[canonical].push(rest);
        }
        continue;
      }
      const fallback = slugifyLabel(label);
      if (isLikelySectionHeader(rawLine)) {
        currentKey = fallback;
        if (headingMatch[2].trim()) {
          sections[fallback] = sections[fallback] ?? [];
          sections[fallback].push(headingMatch[2].trim());
        }
        continue;
      }
    }

    if (currentKey) {
      sections[currentKey] = sections[currentKey] ?? [];
      sections[currentKey].push(rawLine);
    }
  }

  const result: Record<string, unknown> = {};

  for (const [key, values] of Object.entries(sections)) {
    const joined = values.join("\n").trim();
    if (!joined) continue;

    if (key === "overview") result.overview = joined;
    else if (key === "eligibility") result.eligibility = parseListLikeSection(joined);
    else if (key === "requirements") result.requirements = parseListLikeSection(joined);
    else if (key === "responsibilities") result.responsibilities = parseListLikeSection(joined);
    else if (key === "benefits") {
      const list = parseListLikeSection(joined);
      result.benefits = list;
      const funding = parseFunding(joined);
      if (funding) result.funding = funding;
    } else if (key === "requiredDocuments") {
      const list = parseListLikeSection(joined);
      result.requiredDocuments = list.map((item) => ({
        name: item.replace(/\s*[-•]\s*/, "").trim(),
        description: null,
      }));
    } else if (key === "applicationSteps") result.applicationSteps = parseListLikeSection(joined);
    else if (key === "importantDates") result.importantDates = parseImportantDates(joined);
    else if (key === "faq") result.faq = parseFaqBlocks(joined);
    else if (key === "contact") result.contact = parseContact(joined);
  }

  if (!result.overview && rawText) result.overview = normalizeWhitespace(rawText.slice(0, 1400));

  const cityMatch = rawText.match(/(?:in|at)\s+([A-Z][a-zA-Z.-]+(?:\s+[A-Z][a-zA-Z.-]+)*)/);
  if (cityMatch) result.city = cityMatch[1].trim();

  const countryMatch = rawText.match(/(?:Country|Location|Location:|Based in)\s*[:\-]?\s*([A-Z][A-Za-z .'-]+)/i);
  if (countryMatch) result.country = countryMatch[1].trim();

  const applyUrl = firstMatch(rawText, /https?:\/\/[^\s]+/i) ?? firstMatch(rawText, /(?:apply|application|submit)\s*[:\-]?\s*(https?:\/\/[^\s]+)/i);
  if (applyUrl) result.applicationUrl = applyUrl;

  const workModeText = rawText.toLowerCase();
  if (/remote|virtual|online/i.test(workModeText)) result.workMode = "remote";
  else if (/hybrid/i.test(workModeText)) result.workMode = "hybrid";
  else if (/in[- ]person|onsite|on-site|in person|at the office/i.test(workModeText)) result.workMode = "in_person";

  const durationMatch = rawText.match(/(?:duration|length|term|program duration)\s*[:\-]?\s*([A-Za-z0-9–-]+(?:\s+[A-Za-z0-9–-]+){0,5})/i);
  if (durationMatch) result.duration = durationMatch[1].trim();

  const startDateMatch = rawText.match(/(?:Earliest Session Start Date|Start Date|Program Start)\s*[:\-]?\s*(\d{4}-\d{2}|[A-Z][a-z]+ \d{4}|\d{4})/i);
  if (startDateMatch) result.startDate = startDateMatch[1].trim();

  const deadlineMatch = rawText.match(/(?:Application Deadline|Deadline)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|\d{4}-\d{2}|[A-Z][a-z]+ \d{1,2}, \d{4}|\d{1,2} [A-Z][a-z]+ \d{4})/i);
  if (deadlineMatch) result.deadline = deadlineMatch[1].trim();

  const studyLevelMatches = [] as string[];
  const lower = rawText.toLowerCase();
  if (/(undergraduate|bachelor)/i.test(lower)) studyLevelMatches.push("undergraduate");
  if (/(master|masters|graduate)/i.test(lower)) studyLevelMatches.push("masters");
  if (/(phd|doctoral|doctoral degree)/i.test(lower)) studyLevelMatches.push("phd");
  if (/(postdoc|postdoctoral)/i.test(lower)) studyLevelMatches.push("postdoc");
  if (studyLevelMatches.length) result.studyLevels = [...new Set(studyLevelMatches)];

  const contact = result.contact as OpportunityStructuredContact | null | undefined;
  if (contact && !contact.email && !contact.institution) {
    result.contact = null;
  }

  return result;
}

export function normalizeOpportunityStructuredData(rawValue: unknown, fallbackTitle?: string | null): OpportunityStructuredData | null {
  if (!rawValue) {
    return fallbackTitle ? { title: fallbackTitle } : null;
  }

  if (typeof rawValue === "string") {
    const parsed = parseStructuredSections(rawValue);
    return {
      title: fallbackTitle ?? null,
      ...parsed,
    } as OpportunityStructuredData;
  }

  if (typeof rawValue === "object") {
    const structured = rawValue as Record<string, unknown>;
    return {
      title: (structured.title as string | null) ?? fallbackTitle ?? null,
      hostInstitution: (structured.hostInstitution as string | null) ?? null,
      country: (structured.country as string | null) ?? null,
      city: (structured.city as string | null) ?? null,
      studyLevels: Array.isArray(structured.studyLevels) ? structured.studyLevels as string[] : null,
      deadline: (structured.deadline as string | null) ?? null,
      startDate: (structured.startDate as string | null) ?? null,
      duration: (structured.duration as string | null) ?? null,
      workMode: (structured.workMode as string | null) ?? null,
      overview: (structured.overview as string | null) ?? null,
      responsibilities: Array.isArray(structured.responsibilities) ? structured.responsibilities as string[] : [],
      eligibility: Array.isArray(structured.eligibility) ? structured.eligibility as string[] : [],
      requirements: Array.isArray(structured.requirements) ? structured.requirements as string[] : [],
      benefits: Array.isArray(structured.benefits) ? structured.benefits as string[] : [],
      funding: structured.funding as OpportunityStructuredFunding | null,
      requiredDocuments: Array.isArray(structured.requiredDocuments) ? structured.requiredDocuments as OpportunityStructuredDocument[] : [],
      applicationSteps: Array.isArray(structured.applicationSteps) ? structured.applicationSteps as string[] : [],
      importantDates: Array.isArray(structured.importantDates) ? structured.importantDates as OpportunityStructuredImportantDate[] : [],
      faq: Array.isArray(structured.faq) ? structured.faq as OpportunityStructuredFaq[] : [],
      contact: structured.contact as OpportunityStructuredContact | null,
      applicationUrl: (structured.applicationUrl as string | null) ?? null,
      internationalStudentInfo: (structured.internationalStudentInfo as string | null) ?? null,
    };
  }

  return fallbackTitle ? { title: fallbackTitle } : null;
}

export function buildStructuredOpportunityFromText(text: string, base: Record<string, unknown> = {}): OpportunityStructuredData {
  const parsed = parseStructuredSections(text);
  const normalizedBase = typeof base === "object" && base ? base : {};

  return {
    title: typeof normalizedBase.title === "string" ? normalizedBase.title : null,
    hostInstitution: typeof normalizedBase.hostInstitution === "string" ? normalizedBase.hostInstitution : null,
    country: typeof normalizedBase.country === "string" ? normalizedBase.country : (parsed.country as string | null) ?? null,
    city: typeof normalizedBase.city === "string" ? normalizedBase.city : (parsed.city as string | null) ?? null,
    studyLevels: Array.isArray(normalizedBase.studyLevels) ? normalizedBase.studyLevels as string[] : (parsed.studyLevels as string[] | null) ?? null,
    deadline: typeof normalizedBase.deadline === "string" ? normalizedBase.deadline : (parsed.deadline as string | null) ?? null,
    startDate: typeof normalizedBase.startDate === "string" ? normalizedBase.startDate : (parsed.startDate as string | null) ?? null,
    duration: typeof normalizedBase.duration === "string" ? normalizedBase.duration : (parsed.duration as string | null) ?? null,
    workMode: typeof normalizedBase.workMode === "string" ? normalizedBase.workMode : (parsed.workMode as string | null) ?? null,
    overview: typeof normalizedBase.overview === "string" ? normalizedBase.overview : (parsed.overview as string | null) ?? null,
    responsibilities: Array.isArray(normalizedBase.responsibilities) ? normalizedBase.responsibilities as string[] : (parsed.responsibilities as string[] | null) ?? [],
    eligibility: Array.isArray(normalizedBase.eligibility) ? normalizedBase.eligibility as string[] : (parsed.eligibility as string[] | null) ?? [],
    requirements: Array.isArray(normalizedBase.requirements) ? normalizedBase.requirements as string[] : (parsed.requirements as string[] | null) ?? [],
    benefits: Array.isArray(normalizedBase.benefits) ? normalizedBase.benefits as string[] : (parsed.benefits as string[] | null) ?? [],
    funding: typeof normalizedBase.funding === "object" ? normalizedBase.funding as OpportunityStructuredFunding : (parsed.funding as OpportunityStructuredFunding | null) ?? null,
    requiredDocuments: Array.isArray(normalizedBase.requiredDocuments) ? normalizedBase.requiredDocuments as OpportunityStructuredDocument[] : (parsed.requiredDocuments as OpportunityStructuredDocument[] | null) ?? [],
    applicationSteps: Array.isArray(normalizedBase.applicationSteps) ? normalizedBase.applicationSteps as string[] : (parsed.applicationSteps as string[] | null) ?? [],
    importantDates: Array.isArray(normalizedBase.importantDates) ? normalizedBase.importantDates as OpportunityStructuredImportantDate[] : (parsed.importantDates as OpportunityStructuredImportantDate[] | null) ?? [],
    faq: Array.isArray(normalizedBase.faq) ? normalizedBase.faq as OpportunityStructuredFaq[] : (parsed.faq as OpportunityStructuredFaq[] | null) ?? [],
    contact: typeof normalizedBase.contact === "object" ? normalizedBase.contact as OpportunityStructuredContact : (parsed.contact as OpportunityStructuredContact | null) ?? null,
    applicationUrl: typeof normalizedBase.applicationUrl === "string" ? normalizedBase.applicationUrl : (parsed.applicationUrl as string | null) ?? null,
    internationalStudentInfo: typeof normalizedBase.internationalStudentInfo === "string" ? normalizedBase.internationalStudentInfo : (parsed.internationalStudentInfo as string | null) ?? null,
  };
}

export function mergeLegacyOpportunityPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const rawText = String(payload.content ?? payload.description ?? "");
  if (!rawText.trim()) return payload;
  const structured = buildStructuredOpportunityFromText(rawText, payload);
  return {
    ...payload,
    structuredData: structured,
  };
}
