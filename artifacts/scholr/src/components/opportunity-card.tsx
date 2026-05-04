import { Link } from "wouter";
import { Calendar, MapPin, DollarSign, ArrowRight, MessageCircle, Star, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Opportunity {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  category?: string | null;
  country?: string | null;
  fundingType?: string | null;
  deadline?: string | null;
  amount?: string | null;
  status: string;
  featured: boolean;
  pinned: boolean;
  views: number;
  whatsappNumber?: string | null;
  tags?: string[] | null;
}

function getDeadlineInfo(deadline?: string | null): { label: string; color: string } {
  if (!deadline) return { label: "Open", color: "text-[#3B82F6]" };
  const now = new Date();
  const d = new Date(deadline);
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Expired", color: "text-muted-foreground" };
  if (diffDays <= 3) return { label: `${diffDays}d left`, color: "text-red-500" };
  if (diffDays <= 14) return { label: `${diffDays}d left`, color: "text-orange-400" };
  return { label: `${diffDays}d left`, color: "text-[#10B981]" };
}

function getFundingBadge(fundingType?: string | null) {
  if (fundingType === "full") return { label: "Fully Funded", className: "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30" };
  if (fundingType === "partial") return { label: "Partial Funding", className: "bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30" };
  return { label: "Free Entry", className: "bg-muted text-muted-foreground border-border" };
}

export function OpportunityCard({ opp, large = false }: { opp: Opportunity; large?: boolean }) {
  const deadlineInfo = getDeadlineInfo(opp.deadline);
  const fundingBadge = getFundingBadge(opp.fundingType);
  const isExpired = opp.deadline && new Date(opp.deadline) < new Date();
  const whatsappUrl = `https://wa.me/${(opp.whatsappNumber || "1234567890").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I need help applying to: ${opp.title}`)}`;

  if (large) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 ${isExpired ? "opacity-60" : ""}`}
        data-testid={`card-opportunity-large-${opp.id}`}
      >
        <Link href={`/opportunity/${opp.slug}`}>
          <div className="relative h-72 bg-card overflow-hidden">
            {opp.coverImage ? (
              <img
                src={opp.coverImage}
                alt={opp.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-card" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={`text-xs font-medium border ${fundingBadge.className}`}>{fundingBadge.label}</Badge>
                {opp.featured && <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Editor's Pick</Badge>}
              </div>
              <h3 className="font-serif text-white text-2xl font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {opp.title}
              </h3>
              <div className="flex items-center gap-4 mt-3 text-white/70 text-sm">
                {opp.country && <span className="flex items-center gap-1"><MapPin size={13} />{opp.country}</span>}
                {opp.category && <span>{opp.category}</span>}
              </div>
            </div>
          </div>
        </Link>
        <div className="bg-card border border-border/50 rounded-b-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-1 text-sm font-medium ${deadlineInfo.color}`}>
              <Calendar size={13} />
              {opp.deadline ? new Date(opp.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Open deadline"}
              <span className="ml-1 text-xs">({deadlineInfo.label})</span>
            </div>
            {opp.amount && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign size={12} />
                <span className="truncate max-w-32">{opp.amount}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" className="flex-1 font-semibold gap-1">
              <a href={opp.status === "published" ? `/opportunity/${opp.slug}` : "#"} data-testid={`btn-apply-${opp.id}`}>Apply Now <ArrowRight size={14} /></a>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid={`btn-whatsapp-${opp.id}`}>
                <MessageCircle size={14} />
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden bg-card border border-card-border group transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 ${isExpired ? "opacity-60" : ""}`}
      data-testid={`card-opportunity-${opp.id}`}
    >
      <Link href={`/opportunity/${opp.slug}`} className="block">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {opp.coverImage ? (
            <img
              src={opp.coverImage}
              alt={opp.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-card to-card" />
          )}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            <Badge className={`text-xs font-medium border ${fundingBadge.className}`}>{fundingBadge.label}</Badge>
            {opp.featured && <Badge className="bg-primary/20 text-primary border-primary/30 text-xs"><Star size={10} className="mr-1" />Pick</Badge>}
            {opp.pinned && <Badge className="bg-secondary text-secondary-foreground border-border text-xs"><Pin size={10} /></Badge>}
          </div>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {opp.country && <span className="flex items-center gap-1"><MapPin size={11} />{opp.country}</span>}
          {opp.category && <><span>·</span><span>{opp.category}</span></>}
        </div>

        <Link href={`/opportunity/${opp.slug}`}>
          <h3 className="font-serif font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {opp.title}
          </h3>
        </Link>

        {opp.description && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">{opp.description}</p>
        )}

        <div className="flex items-center justify-between mb-4 text-sm">
          <div className={`flex items-center gap-1 ${deadlineInfo.color} font-medium`}>
            <Calendar size={13} />
            {opp.deadline
              ? new Date(opp.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "Open"}
          </div>
          {opp.amount && (
            <span className="text-xs text-muted-foreground truncate max-w-28">{opp.amount}</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1 text-xs font-semibold gap-1" data-testid={`btn-apply-${opp.id}`}>
            <Link href={`/opportunity/${opp.slug}`}>Apply Now <ArrowRight size={12} /></Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10" data-testid={`btn-whatsapp-card-${opp.id}`}>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={13} />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
