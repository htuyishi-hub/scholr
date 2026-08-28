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
  qualifications: "requirements",
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
  responsibilities: "responsibilities",
  location: "location",
  "work mode": "workMode",
};

const LIST_PREFIX = /^(?:[-*•]\s*|\d+[.)]\s*)/;

function normalizeWhitespace(value: string): string {
  return value.replace(/\r/g, "").replace(/\s+/g, " ").trim();
}

function slugifyLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parseListItems(text: string): string[] {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const items: string[] = [];
  for (const raw of lines) {
    const item = raw.replace(LIST_PREFIX, "").trim();
    if (item) items.push(item.replace(/\s+/g, " ").trim());
  }
  return items;
}

function parseFaqBlocks(text: string): OpportunityStructuredFaq[] {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
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

    if (currentQ) currentA.push(raw);
  }

  if (currentQ) faq.push({ question: currentQ, answer: currentA.join(" ").trim() });
  return faq.filter((entry) => entry.question && entry.answer);
}

function parseImportantDates(text: string): OpportunityStructuredImportantDate[] {
  const items: OpportunityStructuredImportantDate[] = [];
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) continue;
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
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const contact: OpportunityStructuredContact = {};
  if (emailMatch) contact.email = emailMatch[0];
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const filtered = lines.filter((line) => !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(line));
  if (filtered[0]) contact.institution = filtered[0];
  if (filtered[1]) contact.department = filtered.slice(1).join(" ");
  return contact.email || contact.institution ? contact : null;
}

function parseFunding(text: string): OpportunityStructuredFunding | null {
  const value = normalizeWhitespace(text);
  if (!value) return null;
  const amountMatch = value.match(/(?:CHF|USD|EUR|GBP|KES|RWF|CAD|AUD)\s*([0-9][0-9,\.]*)/i);
  const numeric = Number((amountMatch?.[1] ?? "").replace(/,/g, ""));
  const currency = (value.match(/(CHF|USD|EUR|GBP|KES|RWF|CAD|AUD)/i) ?? [])[1] ?? null;
  let status = null;
  if (/fully funded|full funding/i.test(value)) status = "fully_funded";
  else if (/stipend/i.test(value)) status = "stipend";
  else if (/partial|scholarship/i.test(value)) status = "partial";

  return {
    status,
    amount: Number.isFinite(numeric) ? numeric : null,
    currency: currency ?? null,
    frequency: /monthly/i.test(value) ? "monthly" : /annual|yearly/i.test(value) ? "annual" : null,
    description: value,
  };
}

function parseStructuredSections(rawText: string): Record<string, unknown> {
  const text = rawText.replace(/\r/g, "").trim();
  if (!text) return {};

  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const sections: Record<string, string[]> = {};
  let currentKey: string | null = null;

  for (const rawLine of lines) {
    const headingMatch = rawLine.match(/^([A-Za-z0-9 &/()'-]+)\s*:\s*(.*)$/);
    if (headingMatch) {
      const label = headingMatch[1].trim();
      const canonical = Object.keys(LABELED_SECTION_ALIASES).find((alias) => slugifyLabel(alias) === slugifyLabel(label));
      const nextKey = canonical ? LABELED_SECTION_ALIASES[canonical] : null;
      if (nextKey) {
        currentKey = nextKey;
        if (headingMatch[2].trim()) {
          sections[nextKey] = sections[nextKey] ?? [];
          sections[nextKey].push(headingMatch[2].trim());
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
    else if (key === "eligibility") result.eligibility = parseListItems(joined);
    else if (key === "requirements") result.requirements = parseListItems(joined);
    else if (key === "responsibilities") result.responsibilities = parseListItems(joined);
    else if (key === "benefits") {
      const items = parseListItems(joined);
      result.benefits = items;
      const funding = parseFunding(joined);
      if (funding) result.funding = funding;
    } else if (key === "requiredDocuments") {
      result.requiredDocuments = parseListItems(joined).map((item) => ({ name: item, description: null }));
    } else if (key === "applicationSteps") result.applicationSteps = parseListItems(joined);
    else if (key === "importantDates") result.importantDates = parseImportantDates(joined);
    else if (key === "faq") result.faq = parseFaqBlocks(joined);
    else if (key === "contact") result.contact = parseContact(joined);
  }

  const applyUrl = text.match(/https?:\/\/[^\s]+/i);
  if (applyUrl) result.applicationUrl = applyUrl[0];

  const countryMatch = text.match(/(?:country|location)\s*[:\-]?\s*([A-Z][A-Za-z .'-]+)/i);
  if (countryMatch) result.country = countryMatch[1].trim();

  const workModeText = text.toLowerCase();
  if (/remote|virtual|online/i.test(workModeText)) result.workMode = "remote";
  else if (/hybrid/i.test(workModeText)) result.workMode = "hybrid";
  else if (/in[- ]person|onsite|on-site|in person/i.test(workModeText)) result.workMode = "in_person";

  const deadlineMatch = text.match(/(?:application deadline|deadline)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|\d{4}-\d{2}|[A-Z][a-z]+ \d{1,2}, \d{4}|\d{1,2} [A-Z][a-z]+ \d{4})/i);
  if (deadlineMatch) result.deadline = deadlineMatch[1].trim();

  const studyLevels: string[] = [];
  if (/(undergraduate|bachelor)/i.test(text)) studyLevels.push("undergraduate");
  if (/(master|masters|graduate)/i.test(text)) studyLevels.push("masters");
  if (/(phd|doctoral)/i.test(text)) studyLevels.push("phd");
  if (/(postdoc|postdoctoral)/i.test(text)) studyLevels.push("postdoc");
  if (studyLevels.length) result.studyLevels = [...new Set(studyLevels)];

  return result;
}

export function normalizeOpportunityStructuredData(rawValue: unknown, fallbackTitle?: string | null): OpportunityStructuredData | null {
  if (!rawValue) return fallbackTitle ? { title: fallbackTitle } : null;

  if (typeof rawValue === "string") {
    return {
      title: fallbackTitle ?? null,
      ...parseStructuredSections(rawValue),
    } as OpportunityStructuredData;
  }

  if (typeof rawValue === "object") {
    const value = rawValue as Record<string, unknown>;
    return {
      title: (value.title as string | null) ?? fallbackTitle ?? null,
      hostInstitution: (value.hostInstitution as string | null) ?? null,
      country: (value.country as string | null) ?? null,
      city: (value.city as string | null) ?? null,
      studyLevels: Array.isArray(value.studyLevels) ? (value.studyLevels as string[]) : null,
      deadline: (value.deadline as string | null) ?? null,
      startDate: (value.startDate as string | null) ?? null,
      duration: (value.duration as string | null) ?? null,
      workMode: (value.workMode as string | null) ?? null,
      overview: (value.overview as string | null) ?? null,
      responsibilities: Array.isArray(value.responsibilities) ? (value.responsibilities as string[]) : [],
      eligibility: Array.isArray(value.eligibility) ? (value.eligibility as string[]) : [],
      requirements: Array.isArray(value.requirements) ? (value.requirements as string[]) : [],
      benefits: Array.isArray(value.benefits) ? (value.benefits as string[]) : [],
      funding: (value.funding as OpportunityStructuredFunding | null) ?? null,
      requiredDocuments: Array.isArray(value.requiredDocuments) ? (value.requiredDocuments as OpportunityStructuredDocument[]) : [],
      applicationSteps: Array.isArray(value.applicationSteps) ? (value.applicationSteps as string[]) : [],
      importantDates: Array.isArray(value.importantDates) ? (value.importantDates as OpportunityStructuredImportantDate[]) : [],
      faq: Array.isArray(value.faq) ? (value.faq as OpportunityStructuredFaq[]) : [],
      contact: (value.contact as OpportunityStructuredContact | null) ?? null,
      applicationUrl: (value.applicationUrl as string | null) ?? null,
      internationalStudentInfo: (value.internationalStudentInfo as string | null) ?? null,
    };
  }

  return fallbackTitle ? { title: fallbackTitle } : null;
}

export function buildStructuredOpportunityFromText(text: string, base: Record<string, unknown> = {}): OpportunityStructuredData {
  const parsed = parseStructuredSections(text);
  const value = typeof base === "object" ? base : {};

  return {
    title: typeof value.title === "string" ? value.title : null,
    hostInstitution: typeof value.hostInstitution === "string" ? value.hostInstitution : null,
    country: typeof value.country === "string" ? value.country : (parsed.country as string | null) ?? null,
    city: typeof value.city === "string" ? value.city : (parsed.city as string | null) ?? null,
    studyLevels: Array.isArray(value.studyLevels) ? (value.studyLevels as string[]) : (parsed.studyLevels as string[] | null) ?? null,
    deadline: typeof value.deadline === "string" ? value.deadline : (parsed.deadline as string | null) ?? null,
    startDate: typeof value.startDate === "string" ? value.startDate : (parsed.startDate as string | null) ?? null,
    duration: typeof value.duration === "string" ? value.duration : (parsed.duration as string | null) ?? null,
    workMode: typeof value.workMode === "string" ? value.workMode : (parsed.workMode as string | null) ?? null,
    overview: typeof value.overview === "string" ? value.overview : (parsed.overview as string | null) ?? null,
    responsibilities: Array.isArray(value.responsibilities) ? (value.responsibilities as string[]) : (parsed.responsibilities as string[] | null) ?? [],
    eligibility: Array.isArray(value.eligibility) ? (value.eligibility as string[]) : (parsed.eligibility as string[] | null) ?? [],
    requirements: Array.isArray(value.requirements) ? (value.requirements as string[]) : (parsed.requirements as string[] | null) ?? [],
    benefits: Array.isArray(value.benefits) ? (value.benefits as string[]) : (parsed.benefits as string[] | null) ?? [],
    funding: typeof value.funding === "object" ? (value.funding as OpportunityStructuredFunding) : (parsed.funding as OpportunityStructuredFunding | null) ?? null,
    requiredDocuments: Array.isArray(value.requiredDocuments) ? (value.requiredDocuments as OpportunityStructuredDocument[]) : (parsed.requiredDocuments as OpportunityStructuredDocument[] | null) ?? [],
    applicationSteps: Array.isArray(value.applicationSteps) ? (value.applicationSteps as string[]) : (parsed.applicationSteps as string[] | null) ?? [],
    importantDates: Array.isArray(value.importantDates) ? (value.importantDates as OpportunityStructuredImportantDate[]) : (parsed.importantDates as OpportunityStructuredImportantDate[] | null) ?? [],
    faq: Array.isArray(value.faq) ? (value.faq as OpportunityStructuredFaq[]) : (parsed.faq as OpportunityStructuredFaq[] | null) ?? [],
    contact: typeof value.contact === "object" ? (value.contact as OpportunityStructuredContact) : (parsed.contact as OpportunityStructuredContact | null) ?? null,
    applicationUrl: typeof value.applicationUrl === "string" ? value.applicationUrl : (parsed.applicationUrl as string | null) ?? null,
    internationalStudentInfo: typeof value.internationalStudentInfo === "string" ? value.internationalStudentInfo : (parsed.internationalStudentInfo as string | null) ?? null,
  };
}
