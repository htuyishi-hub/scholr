import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { OpportunityCard } from "@/components/opportunity-card";
import { useListOpportunities } from "@workspace/api-client-react";

const CATEGORIES = ["Scholarships", "Fellowships", "Grants", "Internships", "Conferences", "Competitions"];
const COUNTRIES = ["United States", "United Kingdom", "Canada", "Germany", "France", "Australia", "Japan", "China", "Netherlands", "Sweden", "Norway", "Switzerland"];
const FUNDING_TYPES = [
  { value: "full", label: "Fully Funded" },
  { value: "partial", label: "Partial" },
  { value: "free", label: "Free Entry" },
];
const DEADLINE_FILTERS = [
  { value: "soon", label: "Next 7 Days" },
  { value: "this_month", label: "This Month" },
  { value: "open", label: "Open" },
];
const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "deadline_soonest", label: "Deadline Soonest" },
  { value: "most_viewed", label: "Most Viewed" },
];

export function Browse() {
  const [location] = useLocation();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Parse initial params from URL
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const [q, setQ] = useState(urlParams.get("q") || "");
  const [category, setCategory] = useState(urlParams.get("category") || "");
  const [country, setCountry] = useState("");
  const [fundingType, setFundingType] = useState("");
  const [deadline, setDeadline] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState(q);

  const { data, isLoading } = useListOpportunities({
    q: q || undefined,
    status: "published",
    category: category || undefined,
    country: country || undefined,
    fundingType: fundingType || undefined,
    deadline: (deadline as "soon" | "this_month" | "open" | undefined) || undefined,
    sort: (sort as "latest" | "deadline_soonest" | "most_viewed") || "latest",
    page,
    limit: 24,
  });

  const opportunities = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleSearch = () => {
    setQ(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setCategory("");
    setCountry("");
    setFundingType("");
    setDeadline("");
    setSort("latest");
    setQ("");
    setSearchInput("");
    setPage(1);
  };

  const hasActiveFilters = category || country || fundingType || deadline || q;

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">Browse Opportunities</h1>
        <p className="text-muted-foreground">{total > 0 ? `${total.toLocaleString()} opportunities found` : "Discover your next scholarship or fellowship"}</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="search"
            placeholder="Search opportunities..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-11 h-11 rounded-xl bg-card border-border"
            data-testid="input-browse-search"
          />
        </div>
        <Button onClick={handleSearch} className="rounded-xl px-6" data-testid="button-browse-search">Search</Button>
        <Button
          variant="outline"
          className="rounded-xl gap-2 lg:hidden"
          onClick={() => setFiltersOpen(!filtersOpen)}
          data-testid="button-filters-toggle"
        >
          <SlidersHorizontal size={16} /> Filters
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className={`
          ${filtersOpen ? "block" : "hidden"} lg:block
          w-full lg:w-64 flex-shrink-0 space-y-6
        `}>
          <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-auto p-0 text-primary hover:text-primary/80 text-xs gap-1" onClick={clearFilters} data-testid="button-clear-filters">
                  <X size={12} /> Clear all
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(category === cat ? "" : cat); setPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${category === cat ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted text-foreground"}`}
                    data-testid={`filter-category-${cat}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Country</Label>
              <Select value={country} onValueChange={(v) => { setCountry(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="rounded-lg" data-testid="filter-country">
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funding Type</Label>
              <div className="space-y-1">
                {FUNDING_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setFundingType(fundingType === value ? "" : value); setPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${fundingType === value ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted text-foreground"}`}
                    data-testid={`filter-funding-${value}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deadline</Label>
              <div className="space-y-1">
                {DEADLINE_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setDeadline(deadline === value ? "" : value); setPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${deadline === value ? "bg-primary/15 text-primary font-medium" : "hover:bg-muted text-foreground"}`}
                    data-testid={`filter-deadline-${value}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sort By</Label>
              <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
                <SelectTrigger className="rounded-lg" data-testid="filter-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
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
            <div className="text-center py-24 text-muted-foreground">
              <Search size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-xl font-serif font-semibold mb-2">No results found</p>
              <p className="text-sm">Try adjusting your filters or search terms.</p>
              <Button variant="outline" onClick={clearFilters} className="mt-6 rounded-full" data-testid="button-no-results-clear">
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {opportunities.map((opp) => (
                  <OpportunityCard key={opp.id} opp={opp} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12" data-testid="pagination">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-full"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-full"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
