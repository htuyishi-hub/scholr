import { Link } from "wouter";
import { Calendar, MapPin, DollarSign, ArrowRight, MessageCircle, Star, Pin, Zap, Clock, Globe, Trophy, Flame, BookOpen, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/smart-image";

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
  createdAt?: string | null;
  // Eligibility (from student context, passed in)
  _eligibility?: "qualify" | "likely" | "check" | "incomplete" | null;
}

const SMART_TAG_CONFIG: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  "Fast Response":    { label: "⚡ Fast Response",    icon: Zap,       color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  "Fully Funded":     { label: "💰 Fully Funded",     icon: DollarSign,color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  "Open to All":      { label: "🌍 Open to All",      icon: Globe,     color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "Women Only":       { label: "👩 Women Only",       icon: Globe,     color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  "Highly Competitive":{ label: "🏆 Competitive",    icon: Trophy,    color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  "No Essay Required":{ label: "📋 No Essay",         icon: BookOpen,  color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  "STEM":             { label: "🔬 STEM",             icon: Zap,       color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  "Africa Focus":     { label: "🌱 Africa Focus",     icon: Sprout,    color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

const ELIGIBILITY_CONFIG = {
  qualify:    { label: "✓ You qualify",          color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  likely:     { label: "~ Likely eligible",       color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  check:      { label: "! Check requirements",    color: "bg-red-500/20 text-red-400 border-red-500/30" },
  incomplete: { label: "○ Complete profile",      color: "bg-muted text-muted-foreground border-border" },
};

function getAutoTags(opp: Opportunity): string[] {
  const tags: string[] = [];
  const now = Date.now();
  if (opp.deadline) {
    const days = Math.ceil((new Date(opp.deadline).getTime() - now) / (1000 * 60 * 60 * 24));
    if (days > 0 && days <= 14) tags.push("Closing Soon");
  }
  if (opp.createdAt) {
    const days = Math.ceil((now - new Date(opp.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7) tags.push("Just Added");
  }
  if (opp.views >= 500) tags.push("Popular");
  if (opp.fundingType === "full") tags.push("Fully Funded");
  return tags;
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

function SmartTagPills({ opp }: { opp: Opportunity }) {
  const manualTags = (opp.tags || []).filter((t) => SMART_TAG_CONFIG[t]);
  const autoTags = getAutoTags(opp);
  const allTags = [...new Set([...autoTags, ...manualTags])].slice(0, 3);

  if (allTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
      {allTags.map((tag) => {
        if (tag === "Closing Soon") return (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-red-500/20 text-red-400 border-red-500/30">
            <Clock size={9} />Closing Soon
          </span>
        );
        if (tag === "Just Added") return (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-primary/20 text-primary border-primary/30">
            🆕 Just Added
          </span>
        );
        if (tag === "Popular") return (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-orange-500/20 text-orange-400 border-orange-500/30">
            <Flame size={9} />Popular
          </span>
        );
        const cfg = SMART_TAG_CONFIG[tag];
        if (!cfg) return null;
        return (
          <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      })}
    </div>
  );
}

export function OpportunityCard({ opp, large = false }: { opp: Opportunity; large?: boolean }) {
  const deadlineInfo = getDeadlineInfo(opp.deadline);
  const fundingBadge = getFundingBadge(opp.fundingType);
  const isExpired = opp.deadline && new Date(opp.deadline) < new Date();
  const whatsappUrl = `https://wa.me/${(opp.whatsappNumber || "1234567890").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I need help applying to: ${opp.title}`)}`;
  const eligCfg = opp._eligibility ? ELIGIBILITY_CONFIG[opp._eligibility] : null;

  if (large) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 ${isExpired ? "opacity-60" : ""}`}
        data-testid={`card-opportunity-large-${opp.id}`}
      >
        <Link href={`/opportunity/${opp.slug}`}>
          <div className="relative h-72 overflow-hidden">
            <SmartImage src={opp.coverImage} alt={opp.title} className="h-full w-full" fit="contain" eager={true} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
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
          <SmartTagPills opp={opp} />
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
            <Button asChild className="flex-1 font-semibold gap-1 h-11 sm:h-9">
              <Link href={`/opportunity/${opp.slug}`}>View Details <ArrowRight size={14} /></Link>
            </Button>
            <Button asChild variant="outline" className="h-11 sm:h-9 px-4 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid={`btn-whatsapp-${opp.id}`}>
                <MessageCircle size={18} className="sm:w-4 sm:h-4" />
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
        <div className="relative aspect-video overflow-hidden">
          <SmartImage src={opp.coverImage} alt={opp.title} className="h-full w-full" fit="contain" />
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            <Badge className={`text-xs font-medium border ${fundingBadge.className}`}>{fundingBadge.label}</Badge>
            {opp.featured && <Badge className="bg-primary/20 text-primary border-primary/30 text-xs"><Star size={10} className="mr-1" />Pick</Badge>}
            {opp.pinned && <Badge className="bg-secondary text-secondary-foreground border-border text-xs"><Pin size={10} /></Badge>}
          </div>
          {eligCfg && (
            <div className="absolute top-3 right-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${eligCfg.color}`}>
                {eligCfg.label}
              </span>
            </div>
          )}
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
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2 leading-relaxed">{opp.description}</p>
        )}

        <SmartTagPills opp={opp} />

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
          <Button asChild className="flex-1 text-sm font-semibold gap-1 h-11 sm:h-9" data-testid={`btn-apply-${opp.id}`}>
            <Link href={`/opportunity/${opp.slug}`}>View Details <ArrowRight size={14} className="sm:w-3 sm:h-3" /></Link>
          </Button>
          <Button asChild variant="outline" className="h-11 sm:h-9 px-4 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10" data-testid={`btn-whatsapp-card-${opp.id}`}>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} className="sm:w-4 sm:h-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
