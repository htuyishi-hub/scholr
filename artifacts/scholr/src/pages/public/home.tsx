import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, ChevronDown, ArrowRight, Zap, Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { OpportunityCard } from "@/components/opportunity-card";
import {
  useListOpportunities,
  useGetFeaturedOpportunities,
  useGetOpportunitiesStats,
} from "@workspace/api-client-react";

const CATEGORIES = ["All", "Scholarships", "Fellowships", "Grants", "Internships", "Conferences", "Competitions"];

export function Home() {
  const [, setLocation] = useLocation();
  const [searchQ, setSearchQ] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [page] = useState(1);
  const heroRef = useRef<HTMLDivElement>(null);

  const { data: statsData } = useGetOpportunitiesStats();
  const { data: featuredData } = useGetFeaturedOpportunities();
  const { data: listData, isLoading } = useListOpportunities({
    status: "published",
    category: activeCategory !== "All" ? activeCategory : undefined,
    page,
    limit: 9,
    sort: "latest",
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQ) params.set("q", searchQ);
    if (searchCategory) params.set("category", searchCategory);
    setLocation(`/browse?${params.toString()}`);
  };

  const featured = featuredData || [];
  const opportunities = listData?.items || [];
  const stats = statsData;

  return (
    <div>
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at 60% 40%, rgba(91,33,182,0.18) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(245,158,11,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.10) 0%, transparent 50%)",
        }}
      >
        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Zap size={14} />
            Updated daily with new opportunities
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight" data-testid="text-hero-headline">
            Your Next Opportunity
            <br />
            <span className="text-primary">is One Click Away</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Browse scholarships, fellowships, and grants curated for ambitious students worldwide.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-12">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type="search"
                  placeholder="Search scholarships, fellowships..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-11 h-12 rounded-full bg-card/60 backdrop-blur border-border text-base"
                  data-testid="input-search"
                />
              </div>
              <Select value={searchCategory || "all"} onValueChange={(v) => setSearchCategory(v === "all" ? "" : v)}>
                <SelectTrigger className="w-44 h-12 rounded-full bg-card/60 backdrop-blur border-border" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.filter(c => c !== "All").map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} size="lg" className="rounded-full px-8 font-semibold" data-testid="button-search">
              Search
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-serif text-primary" data-testid="text-total-opportunities">
                {stats ? `${stats.totalOpportunities.toLocaleString()}+` : "2,400+"}
              </span>
              <span className="text-muted-foreground">Opportunities</span>
            </div>
            <div className="w-px h-6 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-primary" />
              <span className="text-2xl font-bold font-serif" data-testid="text-total-countries">
                {stats ? stats.totalCountries : 45}
              </span>
              <span className="text-muted-foreground">Countries</span>
            </div>
            <div className="w-px h-6 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="text-[#10B981]" />
              <span className="text-muted-foreground">Updated Daily</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* Filter Pills */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b border-border py-3 px-4">
        <div className="container mx-auto flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
              data-testid={`pill-category-${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Section */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 md:px-6 py-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 rounded-full bg-primary" />
            <h2 className="font-serif text-2xl font-bold">Editor's Picks This Week</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {featured[0] && (
              <div className="lg:col-span-3">
                <OpportunityCard opp={featured[0]} large />
              </div>
            )}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {featured.slice(1, 3).map((opp) => (
                <OpportunityCard key={opp.id} opp={opp} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Grid */}
      <section className="container mx-auto px-4 md:px-6 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full bg-primary" />
            <h2 className="font-serif text-2xl font-bold">
              {activeCategory === "All" ? "Latest Opportunities" : activeCategory}
            </h2>
          </div>
          <Button variant="ghost" asChild className="text-primary hover:text-primary gap-1">
            <a href="/browse">View all <ArrowRight size={14} /></a>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden">
                <Skeleton className="aspect-video" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-serif">No opportunities found in this category.</p>
            <p className="text-sm mt-2">Try selecting a different category or browse all opportunities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        )}

        {listData && listData.total > 9 && (
          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="rounded-full px-10 gap-2">
              <a href="/browse">Browse All {listData.total} Opportunities <ArrowRight size={16} /></a>
            </Button>
          </div>
        )}
      </section>

      {/* Newsletter / WhatsApp Banner */}
      <section className="bg-card border-y border-border py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold mb-3">Never Miss an Opportunity</h2>
          <p className="text-muted-foreground mb-8">Join thousands of students who get fresh scholarships delivered weekly.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="rounded-full font-semibold gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white">
              <a href="https://wa.me/1234567890?text=Hello!%20I%20want%20to%20join%20the%20scholr%20community." target="_blank" rel="noopener noreferrer" data-testid="btn-whatsapp-community">
                Join WhatsApp Channel
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
