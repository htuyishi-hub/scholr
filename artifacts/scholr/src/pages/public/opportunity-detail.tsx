import { useState, useEffect } from "react";
import { Link } from "wouter";
import { SmartImage } from "@/components/smart-image";
import {
  ChevronRight,
  Calendar,
  Eye,
  Share2,
  ExternalLink,
  MessageCircle,
  MapPin,
  BookOpen,
  DollarSign,
  GraduationCap,
  Building,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { OpportunityCard } from "@/components/opportunity-card";
import { ApplyWithUsModal } from "@/components/apply-with-us-modal";
import { useStudent } from "@/hooks/use-student-auth";
import {
  useGetOpportunityBySlug,
  useIncrementOpportunityViews,
  useGetRelatedOpportunities,
} from "@workspace/api-client-react";

// Local helpers: the generated `Opportunity` type doesn't include some UI-only fields,
// but we still want compile-time safety and no `unknown` rendering.
const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isBoolean = (v: unknown): v is boolean => typeof v === "boolean";
const asString = (v: unknown): string | null => (isString(v) ? v : null);
const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => isString(x)) : []);

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const end = new Date(deadline);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Deadline passed");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      else setTimeLeft(`${hours}h ${minutes}m`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const urgencyColor = days <= 3 ? "text-red-500" : days <= 14 ? "text-orange-400" : "text-[#10B981]";

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold font-mono ${urgencyColor}`} data-testid="text-countdown">
        {timeLeft}
      </div>
      <div className="text-xs text-muted-foreground mt-1">remaining</div>
    </div>
  );
}

type Opportunity = Parameters<typeof OpportunityCard>[0]["opp"];

type OpportunityExtended = Opportunity & {
  hostOrganization?: unknown;
  numberOfAwards?: unknown;
  essayRequired?: unknown;
  interviewRequired?: unknown;
  renewable?: unknown;
  applicationFee?: unknown;
  requiredDocuments?: unknown;
  eligibleCountries?: unknown;
  ineligibleCountries?: unknown;
  minGpa?: unknown;
  minEnglishIelts?: unknown;
  eligibleGenders?: unknown;
  genderRestriction?: unknown;
  // studyLevel exists on the API but may be typed differently in generated `Opportunity`
  // so we treat it as unknown at runtime.
  studyLevel?: unknown;
};

function EligibilityPanel({
  opp,
  student,
}: {
  opp: OpportunityExtended;
  student: {
    gpa?: string | null;
    nationality?: string | null;
    educationLevel?: string | null;
    ieltsScore?: string | null;
  } | null;
}) {
  if (!student) return null;

  const checks: { label: string; status: "pass" | "fail" | "unknown"; detail: string }[] = [];

  const minGpa =
    typeof opp.minGpa === "string" || typeof opp.minGpa === "number" ? parseFloat(String(opp.minGpa)) : 0;
  const userGpa = parseFloat(student.gpa || "0");
  if (minGpa > 0) {
    if (!student.gpa) {
      checks.push({ label: "GPA", status: "unknown", detail: `Min ${minGpa} required — not on your profile` });
    } else {
      checks.push({
        label: "GPA",
        status: userGpa >= minGpa ? "pass" : "fail",
        detail: `Yours ${student.gpa} — Minimum: ${minGpa}`,
      });
    }
  }

  const eligibleCountries = asStringArray(opp.eligibleCountries);
  const ineligibleCountries = asStringArray(opp.ineligibleCountries);
  if (eligibleCountries.length > 0 && student.nationality) {
    checks.push({
      label: "Country",
      status: eligibleCountries.includes(student.nationality) ? "pass" : "fail",
      detail: `${student.nationality} — ${eligibleCountries.includes(student.nationality) ? "eligible" : "not in eligible list"}`,
    });
  } else if (ineligibleCountries.length > 0 && student.nationality) {
    checks.push({
      label: "Country",
      status: ineligibleCountries.includes(student.nationality) ? "fail" : "pass",
      detail: `${student.nationality} — ${ineligibleCountries.includes(student.nationality) ? "ineligible" : "eligible"}`,
    });
  }

  const requiredLevel = Array.isArray(opp.studyLevel) ? (opp.studyLevel as unknown[]).filter((x): x is string => isString(x)) : [];
  if (requiredLevel.length > 0 && student.educationLevel) {
    const levelMap: Record<string, string[]> = {
      "High School": ["undergraduate"],
      "Bachelor's": ["masters", "undergraduate"],
      "Master's": ["phd", "masters"],
      "PhD": ["phd"],
    };
    const userLevels = levelMap[student.educationLevel] || [];
    const matches = requiredLevel.some((l) => userLevels.includes(l));
    checks.push({
      label: "Education",
      status: matches ? "pass" : "fail",
      detail: `You have ${student.educationLevel} — Required: ${requiredLevel.join(", ")}`,
    });
  }

  const minIelts =
    typeof opp.minEnglishIelts === "string" || typeof opp.minEnglishIelts === "number"
      ? parseFloat(String(opp.minEnglishIelts))
      : 0;
  if (minIelts > 0) {
    if (!student.ieltsScore) {
      checks.push({ label: "English", status: "unknown", detail: `IELTS ${minIelts} required — not on your profile` });
    } else {
      const userIelts = parseFloat(student.ieltsScore);
      checks.push({
        label: "English",
        status: userIelts >= minIelts ? "pass" : "fail",
        detail: `Your IELTS ${student.ieltsScore} — Required: ${minIelts}`,
      });
    }
  }

  if (checks.length === 0) return null;

  const passes = checks.filter((c) => c.status === "pass").length;
  const fails = checks.filter((c) => c.status === "fail").length;
  const unknowns = checks.filter((c) => c.status === "unknown").length;
  const overallScore = Math.round((passes / checks.length) * 100);

  const overallLabel = fails > 0 ? "Check Requirements" : unknowns > 0 ? "Likely Eligible" : "You Qualify";
  const overallColor = fails > 0 ? "text-red-400" : unknowns > 0 ? "text-yellow-400" : "text-emerald-400";

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif font-bold text-lg">Your Eligibility</h3>
        <span className={`text-sm font-bold ${overallColor}`}>{overallLabel}</span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Match score</span>
          <span>{overallScore}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${overallScore}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        {checks.map((check, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            {check.status === "pass" && <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />}
            {check.status === "fail" && <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />}
            {check.status === "unknown" && <HelpCircle size={15} className="text-yellow-400 mt-0.5 flex-shrink-0" />}
            <div>
              <span className="font-medium">{check.label}: </span>
              <span className="text-muted-foreground">{check.detail}</span>
            </div>
          </div>
        ))}
      </div>

      {unknowns > 0 && (
        <Button asChild variant="outline" size="sm" className="w-full mt-4 gap-2">
          <Link href="/profile">Complete your profile →</Link>
        </Button>
      )}
    </div>
  );
}

export function OpportunityDetail({ slug }: { slug: string }) {
  const { student } = useStudent();
  const { data: opp, isLoading } = useGetOpportunityBySlug(slug, {
    query: { enabled: !!slug } as any,
  });
  const incrementViews = useIncrementOpportunityViews();
  const { data: related } = useGetRelatedOpportunities(opp?.id || "", {
    query: { enabled: !!opp?.id } as any,
  });

  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    if (opp?.id) incrementViews.mutate({ id: opp.id });
  }, [opp?.id]);

  const handleShare = () => {
    if (!opp) return;
    if (navigator.share) {
      navigator.share({ title: opp.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12">
        <Skeleton className="h-80 w-full rounded-2xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">Opportunity Not Found</h1>
        <p className="text-muted-foreground mb-6">The opportunity you're looking for doesn't exist or has been removed.</p>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/browse">Browse Opportunities</Link>
        </Button>
      </div>
    );
  }

  const oppExt = opp as OpportunityExtended;

  const deadline = opp.deadline ? new Date(opp.deadline) : null;
  const isExpired = !!deadline && deadline < new Date();
  const whatsappUrl = `https://wa.me/${(opp.whatsappNumber || "1234567890").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I need help applying to: ${opp.title}`)}`;
  const contentLines = (opp.content || opp.description || "").split("\n\n");

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="breadcrumb">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight size={14} />
        <Link href="/browse" className="hover:text-primary transition-colors">Browse</Link>
        {opp.category && (
          <>
            <ChevronRight size={14} />
            <Link href={`/browse?category=${opp.category}`} className="hover:text-primary transition-colors">{opp.category}</Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-foreground truncate max-w-48">{opp.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2">
          {opp.coverImage && (
            <figure className="mb-8">
              <SmartImage
                src={opp.coverImage}
                alt={opp.title}
                eager
                fit="contain"
                className="h-[18rem] w-full rounded-2xl sm:h-[24rem] lg:h-[28rem]"
              />
            </figure>
          )}

          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {opp.fundingType === "full" && (
                <Badge className="bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30">Fully Funded</Badge>
              )}
              {opp.category && <Badge variant="secondary">{opp.category}</Badge>}
              {opp.studyLevel?.map((level) => (
                <Badge key={level} variant="outline" className="capitalize">
                  {level}
                </Badge>
              ))}
            </div>

            <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-4" data-testid="text-opportunity-title">
              {opp.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {opp.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  Posted {new Date(opp.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye size={13} />
                {opp.views.toLocaleString()} views
              </span>
              <button onClick={handleShare} className="flex items-center gap-1 hover:text-primary transition-colors" data-testid="button-share">
                <Share2 size={13} />
                Share
              </button>
            </div>
          </div>

          <Separator className="mb-8" />

          <div className="prose prose-invert max-w-none">
            {contentLines.map((para, i) => {
              if (para.startsWith("**") && para.endsWith("**")) {
                const heading = para.replace(/\*\*/g, "");
                return (
                  <h3 key={i} className="font-serif text-xl font-bold mt-8 mb-4 text-foreground">
                    {heading}
                  </h3>
                );
              }
              if (para.startsWith("- ") || para.includes("\n- ")) {
                const items = para
                  .split("\n")
                  .filter((l) => l.startsWith("- "))
                  .map((l) => l.slice(2));
                return (
                  <ul key={i} className="space-y-2 mb-4">
                    {items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-foreground/90">
                        <span className="text-primary mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              return para.trim() ? <p key={i} className="text-foreground/90 leading-relaxed mb-4">{para}</p> : null;
            })}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5" data-testid="sidebar-cta">
            {deadline && (
              <div className="text-center pb-4 border-b border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Application Deadline</p>
                <p className="font-bold text-lg" data-testid="text-deadline">
                  {deadline.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
                {!isExpired && <CountdownTimer deadline={opp.deadline!} />}
                {isExpired && <p className="text-red-500 text-sm font-medium mt-2">Deadline passed</p>}
              </div>
            )}

            {!isExpired && (
              <div className="space-y-3">
                <Button size="lg" className="w-full font-bold gap-2 rounded-xl" onClick={() => setShowApplyModal(true)} data-testid="button-apply-now">
                  <GraduationCap size={15} />
                  Apply With Us
                </Button>
                {opp.applyLink && (
                  <Button asChild size="sm" variant="outline" className="w-full rounded-xl gap-2 text-muted-foreground">
                    <a href={opp.applyLink} target="_blank" rel="noopener noreferrer">
                      Apply Directly <ExternalLink size={13} />
                    </a>
                  </Button>
                )}
              </div>
            )}

            {isExpired && opp.applyLink && (
              <Button asChild size="lg" variant="outline" className="w-full font-bold gap-2 rounded-xl opacity-50" disabled>
                <a href="#">Deadline Passed</a>
              </Button>
            )}

            <Button asChild size="lg" variant="outline" className="w-full border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366] rounded-xl gap-2 font-semibold" data-testid="button-whatsapp-help">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={15} />
                Need Help? Chat on WhatsApp
              </a>
            </Button>

            {!student && (
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">Sign in</Link> to see your eligibility
              </p>
            )}
          </div>

          {student && <EligibilityPanel opp={oppExt} student={student} />}

          <div className="bg-card border border-border rounded-2xl p-6" data-testid="sidebar-quick-facts">
            <h3 className="font-serif font-bold text-lg mb-4">Quick Facts</h3>
            <div className="space-y-3">
              {opp.country && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Country</div>
                    <div className="font-medium">{opp.country}</div>
                  </div>
                </div>
              )}

              {opp.studyLevel && opp.studyLevel.length > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={14} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Study Level</div>
                    <div className="font-medium capitalize">{opp.studyLevel.join(", ")}</div>
                  </div>
                </div>
              )}

              {opp.amount && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <DollarSign size={14} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Award</div>
                    <div className="font-medium">{opp.amount}</div>
                  </div>
                </div>
              )}

              {asString(oppExt.hostOrganization) && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Building size={14} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Host Organization</div>
                    <div className="font-medium">{asString(oppExt.hostOrganization)}</div>
                  </div>
                </div>
              )}

              {isString(oppExt.numberOfAwards) || isNumber(oppExt.numberOfAwards) ? (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Users size={14} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Awards</div>
                    <div className="font-medium">{String(oppExt.numberOfAwards)} positions</div>
                  </div>
                </div>
              ) : null}

              {opp.category && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <BookOpen size={14} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div className="font-medium">{opp.category}</div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-border flex flex-wrap gap-2">
                {oppExt.essayRequired === false && <Badge variant="outline" className="text-xs">📋 No Essay</Badge>}
                {oppExt.interviewRequired === false && <Badge variant="outline" className="text-xs">No Interview</Badge>}
                {oppExt.renewable === true && <Badge variant="outline" className="text-xs">♻️ Renewable</Badge>}
                {oppExt.applicationFee === "0" || oppExt.applicationFee === null ? null : null}
              </div>
            </div>
          </div>

          {opp.tags && opp.tags.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-serif font-bold text-lg mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {opp.tags.map((tag) => (
                  <Link key={tag} href={`/browse?q=${tag}`}>
                    <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors">
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {related && related.length > 0 && (
        <section className="mt-20 pt-12 border-t border-border">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 rounded-full bg-primary" />
            <h2 className="font-serif text-2xl font-bold">Related Opportunities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((r) => (
              <OpportunityCard key={r.id} opp={r} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12">
        <Button asChild variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/browse">
            <ArrowLeft size={16} /> Back to Browse
          </Link>
        </Button>
      </div>

      {showApplyModal && (
        <ApplyWithUsModal
          opportunity={{
            id: opp.id,
            title: opp.title,
            slug: opp.slug,
            applyLink: opp.applyLink,
            deadline: opp.deadline,
            requiredDocuments: Array.isArray(oppExt.requiredDocuments)
              ? oppExt.requiredDocuments.filter((x): x is string => isString(x))
              : null,
          }}
          onClose={() => setShowApplyModal(false)}
        />
      )}
    </div>
  );
}

