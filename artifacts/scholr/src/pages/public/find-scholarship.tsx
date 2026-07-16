import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OpportunityCard } from "@/components/opportunity-card";
import { ChevronRight, ChevronLeft, Search, Sparkles, GraduationCap } from "lucide-react";

const LEVELS = ["Undergraduate", "Masters", "PhD", "Professional Course"];
const FIELDS = ["Engineering", "Business", "Medicine", "Law", "Arts", "Education", "Social Sciences", "Environment", "Agriculture", "Technology", "Other"];
const DESTINATIONS = ["USA", "UK", "Canada", "Australia", "Germany", "France", "Netherlands", "Sweden", "Norway", "Japan", "UAE", "Anywhere"];
const GPA_OPTIONS = [
  { label: "First Class / 90%+", value: "4.0" },
  { label: "2:1 / 70-89%", value: "3.5" },
  { label: "2:2 / 60-69%", value: "3.0" },
  { label: "Pass / 50-59%", value: "2.5" },
  { label: "Below 50%", value: "2.0" },
];
const ENGLISH_OPTIONS = [
  { label: "Yes, IELTS 7+", value: "ielts_high" },
  { label: "Yes, IELTS 6.0–6.5", value: "ielts_mid" },
  { label: "TOEFL 90+", value: "toefl" },
  { label: "Native Speaker", value: "native" },
  { label: "Not yet tested", value: "none" },
];
const TIMELINES = ["This year", "Next year", "Just exploring"];

interface QuizAnswers {
  level: string;
  field: string;
  destinations: string[];
  gpa: string;
  english: string;
  timeline: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function searchOpportunities(answers: QuizAnswers) {
  const params = new URLSearchParams();
  params.set("status", "published");
  params.set("limit", "20");
  if (answers.level && answers.level !== "Professional Course") {
    const levelMap: Record<string, string> = { "Undergraduate": "undergraduate", "Masters": "masters", "PhD": "phd" };
    if (levelMap[answers.level]) params.set("studyLevel", levelMap[answers.level]);
  }
  const res = await fetch(`${BASE}/api/opportunities?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

function computeMatch(opp: Record<string, unknown>, answers: QuizAnswers): number {
  let score = 60;
  const studyLevels = (opp.studyLevel as string[]) || [];
  const levelMap: Record<string, string> = { "Undergraduate": "undergraduate", "Masters": "masters", "PhD": "phd" };
  if (answers.level && studyLevels.includes(levelMap[answers.level])) score += 15;
  if (answers.destinations.includes("Anywhere") || answers.destinations.includes((opp.country as string) || "")) score += 15;
  const minGpa = parseFloat((opp.minGpa as string) || "0");
  const userGpa = parseFloat(answers.gpa || "3.0");
  if (!minGpa || userGpa >= minGpa) score += 10;
  return Math.min(score, 99);
}

export function FindScholarship() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    level: "", field: "", destinations: [], gpa: "", english: "", timeline: ""
  });
  type Opportunity = Parameters<typeof OpportunityCard>[0]["opp"];
  const [results, setResults] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof QuizAnswers, v: string | string[]) => setAnswers((a) => ({ ...a, [k]: v }));
  const toggleDest = (d: string) => {
    if (d === "Anywhere") { set("destinations", ["Anywhere"]); return; }
    setAnswers((a) => ({
      ...a,
      destinations: a.destinations.includes(d)
        ? a.destinations.filter((x) => x !== d)
        : [...a.destinations.filter((x) => x !== "Anywhere"), d],
    }));
  };

  const handleSearch = async () => {
    setLoading(true);
    const opps = await searchOpportunities(answers);

    const scored = opps
      .map((o: Record<string, unknown>) => {
        // computeMatch expects a record; OpportunityCard expects typed opportunity.
        const _match = computeMatch(o, answers);
        return { ...(o as any), _match } as any as Opportunity & { _match: number };
      })
      .sort((a: any, b: any) => (b._match as number) - (a._match as number));

    setResults(scored as Opportunity[]);
    setLoading(false);
    setDone(true);
  };

  const STEPS = [
    {
      question: "What level are you applying for?",
      options: LEVELS,
      value: answers.level,
      onSelect: (v: string) => set("level", v),
      multiple: false,
    },
    {
      question: "What field do you want to study?",
      options: FIELDS,
      value: answers.field,
      onSelect: (v: string) => set("field", v),
      multiple: false,
    },
    {
      question: "Where do you want to study?",
      options: DESTINATIONS,
      value: answers.destinations,
      onSelect: toggleDest,
      multiple: true,
    },
    {
      question: "What's your current academic result?",
      options: GPA_OPTIONS.map((g) => g.label),
      value: answers.gpa,
      onSelect: (v: string) => {
        const found = GPA_OPTIONS.find((g) => g.label === v);
        set("gpa", found?.value || "3.0");
      },
      displayValue: GPA_OPTIONS.find((g) => g.value === answers.gpa)?.label || "",
      multiple: false,
    },
    {
      question: "Do you have English test scores?",
      options: ENGLISH_OPTIONS.map((e) => e.label),
      value: answers.english,
      onSelect: (v: string) => {
        const found = ENGLISH_OPTIONS.find((e) => e.label === v);
        set("english", found?.value || "none");
      },
      displayValue: ENGLISH_OPTIONS.find((e) => e.value === answers.english)?.label || "",
      multiple: false,
    },
    {
      question: "When do you want to start?",
      options: TIMELINES,
      value: answers.timeline,
      onSelect: (v: string) => set("timeline", v),
      multiple: false,
    },
  ];

  if (done) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">We found {results.length} matches for you</h1>
          <p className="text-muted-foreground">Based on your answers — sorted by best match</p>
          <Button variant="outline" className="mt-4" onClick={() => { setDone(false); setStep(0); setAnswers({ level: "", field: "", destinations: [], gpa: "", english: "", timeline: "" }); }}>
            Start Over
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((opp) => (
              <div key={opp.id as string} className="relative">
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs shadow">
                    {opp._match as number}% match
                  </Badge>
                </div>
                <OpportunityCard opp={opp as Parameters<typeof OpportunityCard>[0]["opp"]} />
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !loading && (
          <div className="text-center py-12">
            <Search size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No results found. Try broadening your search.</p>
            <Button className="mt-4" onClick={() => { setDone(false); setStep(0); }}>Try Again</Button>
          </div>
        )}
      </div>
    );
  }

  const currentStep = STEPS[step];
  const canNext = currentStep.multiple
    ? (answers.destinations.length > 0)
    : (step === 1 ? !!answers.field : step === 3 ? !!answers.gpa : step === 4 ? !!answers.english : !!currentStep.value);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-2xl">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <GraduationCap size={28} className="text-primary" />
        </div>
        <h1 className="font-serif text-3xl font-bold mb-2">Find My Scholarship</h1>
        <p className="text-muted-foreground">Answer 6 quick questions to discover scholarships made for you</p>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-8">
        <p className="text-xs text-muted-foreground mb-2">Question {step + 1} of {STEPS.length}</p>
        <h2 className="font-serif text-xl font-bold mb-6">{currentStep.question}</h2>

        <div className="flex flex-wrap gap-3">
          {currentStep.options.map((opt) => {
            const isSelected = currentStep.multiple
              ? (answers.destinations.includes(opt))
              : (currentStep.displayValue ? currentStep.displayValue === opt : currentStep.value === opt);
            return (
              <button
                key={opt}
                onClick={() => currentStep.onSelect(opt)}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="gap-2">
              <ChevronLeft size={16} /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="flex-1 gap-2">
              Continue <ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleSearch} disabled={!canNext || loading} className="flex-1 gap-2">
              {loading ? "Searching..." : <><Sparkles size={16} /> Find My Scholarships</>}
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link href="/browse" className="text-primary hover:underline">Browse all opportunities instead</Link>
      </p>
    </div>
  );
}
