import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ChevronRight, Calendar, Eye, Share2, ExternalLink, MessageCircle,
  MapPin, BookOpen, DollarSign, GraduationCap, Building, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { OpportunityCard } from "@/components/opportunity-card";
import {
  useGetOpportunityBySlug,
  useIncrementOpportunityViews,
  useGetRelatedOpportunities,
} from "@workspace/api-client-react";

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

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m`);
      }
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

export function OpportunityDetail({ slug }: { slug: string }) {
  const { data: opp, isLoading } = useGetOpportunityBySlug(slug, {
    query: { enabled: !!slug } as any
  });
  const incrementViews = useIncrementOpportunityViews();
  const { data: related } = useGetRelatedOpportunities(opp?.id || "", {
    query: { enabled: !!opp?.id } as any
  });

  useEffect(() => {
    if (opp?.id) {
      incrementViews.mutate({ id: opp.id });
    }
  }, [opp?.id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: opp?.title, url: window.location.href });
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

  const deadline = opp.deadline ? new Date(opp.deadline) : null;
  const isExpired = deadline && deadline < new Date();
  const whatsappUrl = `https://wa.me/${(opp.whatsappNumber || "1234567890").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I need help applying to: ${opp.title}`)}`;

  const contentLines = (opp.content || opp.description || "").split("\n\n");

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="breadcrumb">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight size={14} />
        <Link href="/browse" className="hover:text-primary transition-colors">Browse</Link>
        {opp.category && <>
          <ChevronRight size={14} />
          <Link href={`/browse?category=${opp.category}`} className="hover:text-primary transition-colors">{opp.category}</Link>
        </>}
        <ChevronRight size={14} />
        <span className="text-foreground truncate max-w-48">{opp.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Hero Image */}
          {opp.coverImage && (
            <div className="relative h-72 rounded-2xl overflow-hidden mb-8">
              <img src={opp.coverImage} alt={opp.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          )}

          {/* Title & Meta */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {opp.fundingType === "full" && (
                <Badge className="bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30">Fully Funded</Badge>
              )}
              {opp.category && <Badge variant="secondary">{opp.category}</Badge>}
              {opp.studyLevel?.map(level => (
                <Badge key={level} variant="outline" className="capitalize">{level}</Badge>
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

          {/* Content */}
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
                const items = para.split("\n").filter(l => l.startsWith("- ")).map(l => l.slice(2));
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
              return para.trim() ? (
                <p key={i} className="text-foreground/90 leading-relaxed mb-4">{para}</p>
              ) : null;
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
          {/* Deadline & CTA Card */}
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

            {opp.applyLink && (
              <Button asChild size="lg" className="w-full font-bold gap-2 rounded-xl" disabled={!!isExpired} data-testid="button-apply-now">
                <a href={opp.applyLink} target="_blank" rel="noopener noreferrer">
                  Apply Now <ExternalLink size={15} />
                </a>
              </Button>
            )}

            <Button asChild size="lg" variant="outline" className="w-full border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366] rounded-xl gap-2 font-semibold" data-testid="button-whatsapp-help">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={15} />
                Need Help? Chat on WhatsApp
              </a>
            </Button>
          </div>

          {/* Quick Facts */}
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
            </div>
          </div>

          {/* Tags */}
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

      {/* Related Opportunities */}
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
          <Link href="/browse"><ArrowLeft size={16} /> Back to Browse</Link>
        </Button>
      </div>
    </div>
  );
}
