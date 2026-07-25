import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw, Loader2, GraduationCap, Briefcase, ExternalLink,
  ChevronRight, ArrowUpDown, CheckSquare, X, AlertCircle,
  Image as ImageIcon, Clock, Globe, BarChart3, ListFilter,
  Sparkles, Trash2,
} from "lucide-react";
import { computeQuality, scoreBg, STATUS_META } from "@/lib/quality-score";

// ── Types ────────────────────────────────────────────────────────────────────

interface ScrapedItem {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  itemType: "scholarship" | "job";
  status: string;
  description?: string | null;
  deadline?: string | null;
  country?: string | null;
  category?: string | null;
  applyLink?: string | null;
  coverImage?: string | null;
  images?: string[] | null;
  qualityScore?: number | null;
  scrapedAt: string;
  updatedAt?: string | null;
}

interface QueueCounts {
  all: number;
  needs_review: number;
  needs_images: number;
  needs_metadata: number;
  needs_verification: number;
  scheduled: number;
  published: number;
  archived: number;
  rejected: number;
}

type SortMode = "date" | "quality_asc" | "deadline";

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE = () => (import.meta.env.BASE_URL || "").replace(/\/$/, "");
const TOKEN = () => localStorage.getItem("scholr_token") || "";

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE()}/api${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN()}`, "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const PIPELINE_TABS = [
  { key: "all",                label: "All",             icon: ListFilter },
  { key: "needs_review",       label: "Needs Review",    icon: AlertCircle },
  { key: "needs_images",       label: "Needs Images",    icon: ImageIcon },
  { key: "needs_metadata",     label: "Needs Metadata",  icon: BarChart3 },
  { key: "needs_verification", label: "Verification",    icon: Globe },
  { key: "scheduled",          label: "Scheduled",       icon: Clock },
  { key: "published",          label: "Published",       icon: Sparkles },
  { key: "rejected",           label: "Rejected",        icon: X },
] as const;

type TabKey = (typeof PIPELINE_TABS)[number]["key"];

function sortItems(items: ScrapedItem[], mode: SortMode): ScrapedItem[] {
  return [...items].sort((a, b) => {
    if (mode === "quality_asc") {
      const qa = a.qualityScore ?? computeQuality(a as any).score;
      const qb = b.qualityScore ?? computeQuality(b as any).score;
      return qa - qb;
    }
    if (mode === "deadline") {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime();
  });
}

// ── Queue Card ────────────────────────────────────────────────────────────────

function QueueCard({
  item,
  selected,
  onToggle,
  onNavigate,
  onQuickReject,
  onQuickPublish,
  onDelete,
}: {
  item: ScrapedItem;
  selected: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  onQuickReject: () => void;
  onQuickPublish: () => void;
  onDelete: () => void;
}) {
  const score = item.qualityScore ?? computeQuality(item as any).score;
  const statusMeta = STATUS_META[item.status] ?? STATUS_META["needs_review"];
  const isReviewable = ["pending", "needs_review", "needs_images", "needs_metadata", "needs_verification", "enriched"].includes(item.status);

  return (
    <div
      className={`group bg-white border rounded-xl transition-all hover:shadow-md hover:border-gray-300 ${
        selected ? "border-primary ring-1 ring-primary/20" : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Checkbox */}
        <div className="pt-0.5 flex-shrink-0">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            className="border-gray-300"
          />
        </div>

        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          {item.coverImage ? (
            <img
              src={item.coverImage}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {item.itemType === "scholarship"
                ? <GraduationCap size={22} className="text-gray-300" />
                : <Briefcase size={22} className="text-gray-300" />
              }
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${statusMeta.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                  {statusMeta.label}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                  {item.itemType}
                </Badge>
                {item.category && (
                  <span className="text-[10px] text-muted-foreground bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full">
                    {item.category}
                  </span>
                )}
              </div>

              <button
                onClick={onNavigate}
                className="text-sm font-semibold text-gray-900 hover:text-primary transition-colors text-left line-clamp-2 leading-snug"
              >
                {item.title}
              </button>

              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground">{item.source}</span>
                {item.country && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe size={10} /> {item.country}
                  </span>
                )}
                {item.deadline && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={10} /> {item.deadline}
                  </span>
                )}
              </div>
            </div>

            {/* Quality badge */}
            <div className={`flex-shrink-0 text-center px-2.5 py-1.5 rounded-lg border text-xs font-bold ${scoreBg(score)}`}>
              {score}
              <div className="text-[9px] font-normal opacity-70">/ 100</div>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{item.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-muted-foreground hover:text-gray-700 transition-colors"
            title="View source"
          >
            <ExternalLink size={13} />
          </a>
          {isReviewable && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onQuickReject(); }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                title="Reject"
              >
                <X size={13} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onQuickPublish(); }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition-colors"
                title="Publish"
              >
                Publish
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={onNavigate}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-muted-foreground hover:text-gray-700 transition-colors"
            title="Open in editorial workspace"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Bottom meta bar */}
      <div className="px-4 pb-3 flex items-center gap-3 pl-14">
        <span className="text-[10px] text-muted-foreground">
          Scraped {new Date(item.scrapedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
        {(item.images?.length ?? 0) > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <ImageIcon size={9} /> {item.images!.length} images
          </span>
        )}
        {!item.coverImage && (
          <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
            <AlertCircle size={9} /> No cover image
          </span>
        )}
        {!item.applyLink && (
          <span className="text-[10px] text-red-500 flex items-center gap-0.5">
            <AlertCircle size={9} /> No apply link
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EditorialQueue() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [items, setItems] = useState<ScrapedItem[]>([]);
  const [counts, setCounts] = useState<QueueCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("needs_review");
  const [sort, setSort] = useState<SortMode>("date");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showLastRun, setShowLastRun] = useState(false);
  const [lastRun, setLastRun] = useState<{ added: number; duplicates: number } | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      const data = await apiFetch("/scraper/queue-counts");
      setCounts(data);
    } catch { /* counts are non-critical */ }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const qs = activeTab === "all" ? "" : `?status=${activeTab}`;
      const data = await apiFetch(`/scraper/items${qs}`);
      setItems(data);
    } catch {
      toast({ title: "Error loading items", variant: "destructive" });
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchItems();
    fetchCounts();
  }, [fetchItems, fetchCounts]);

  const runScraper = async () => {
    setRunning(true);
    try {
      const result = await apiFetch("/scraper/run", { method: "POST" });
      setLastRun(result);
      setShowLastRun(true);
      toast({ title: `Scrape complete — ${result.added} new items` });
      fetchItems();
      fetchCounts();
    } catch {
      toast({ title: "Scrape failed", variant: "destructive" });
    }
    setRunning(false);
  };

  const quickPublish = async (item: ScrapedItem) => {
    try {
      await apiFetch(`/scraper/items/${item.id}/approve`, { method: "PUT" });
      toast({ title: "Published ✓" });
      fetchItems();
      fetchCounts();
    } catch {
      toast({ title: "Publish failed", variant: "destructive" });
    }
  };

  const quickReject = async (id: string) => {
    try {
      await apiFetch(`/scraper/items/${id}/reject`, { method: "PUT" });
      toast({ title: "Rejected" });
      setItems((p) => p.filter((i) => i.id !== id));
      setCounts((c) => c ? { ...c, rejected: c.rejected + 1, needs_review: Math.max(0, c.needs_review - 1) } : c);
    } catch {
      toast({ title: "Rejection failed", variant: "destructive" });
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await apiFetch(`/scraper/items/${id}`, { method: "DELETE" });
      toast({ title: "Deleted" });
      setItems((p) => p.filter((i) => i.id !== id));
      fetchCounts();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const bulkAction = async (action: string) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await apiFetch("/scraper/items/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      toast({ title: `${selected.size} item(s) updated` });
      fetchItems();
      fetchCounts();
    } catch {
      toast({ title: "Bulk action failed", variant: "destructive" });
    }
    setBulkLoading(false);
  };

  const toggleAll = () => {
    if (selected.size === sortedItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sortedItems.map((i) => i.id)));
    }
  };

  const sortedItems = sortItems(items, sort);
  const allSelected = sortedItems.length > 0 && selected.size === sortedItems.length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Editorial Workspace</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review, enrich, and publish opportunities through the editorial pipeline.
          </p>
        </div>
        <Button onClick={runScraper} disabled={running} className="gap-2 flex-shrink-0">
          {running
            ? <><Loader2 size={14} className="animate-spin" /> Scraping…</>
            : <><RefreshCw size={14} /> Run Scraper</>
          }
        </Button>
      </div>

      {/* Last run banner */}
      {lastRun && showLastRun && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5 flex items-center justify-between">
          <span className="text-sm text-emerald-700">
            ✓ Scrape complete — <strong>{lastRun.added}</strong> new items added, {lastRun.duplicates} duplicates skipped
          </span>
          <button onClick={() => setShowLastRun(false)} className="text-emerald-500 hover:text-emerald-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Pipeline tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {PIPELINE_TABS.map((tab) => {
          const count = counts ? (tab.key === "all" ? counts.all : counts[tab.key as keyof QueueCounts] ?? 0) : null;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              <tab.icon size={13} />
              {tab.label}
              {count !== null && count > 0 && (
                <span className={`ml-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            className="border-gray-300"
          />
          <span className="text-xs text-muted-foreground">
            {loading ? "Loading…" : `${sortedItems.length} item${sortedItems.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={12} className="text-muted-foreground" />
          <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
            <SelectTrigger className="h-8 text-xs w-36 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Latest first</SelectItem>
              <SelectItem value="quality_asc">Quality: low → high</SelectItem>
              <SelectItem value="deadline">Deadline: soonest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
          <CheckSquare size={14} className="text-primary" />
          <span className="text-sm font-medium text-primary mr-2">
            {selected.size} selected
          </span>
          <div className="flex gap-1.5 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-gray-200"
              onClick={() => bulkAction("needs_metadata")}
              disabled={bulkLoading}
            >
              Needs Metadata
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-gray-200"
              onClick={() => bulkAction("needs_images")}
              disabled={bulkLoading}
            >
              Needs Images
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => bulkAction("reject")}
              disabled={bulkLoading}
            >
              {bulkLoading ? <Loader2 size={11} className="animate-spin" /> : "Reject all"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => bulkAction("delete")}
              disabled={bulkLoading}
            >
              {bulkLoading ? <Loader2 size={11} className="animate-spin" /> : <><Trash2 size={11} className="mr-1" />Delete all</>}
            </Button>
            <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-gray-700 ml-1">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Items */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            {activeTab === "needs_review" ? <AlertCircle size={24} className="opacity-30" /> : <Globe size={24} className="opacity-30" />}
          </div>
          <p className="font-medium text-gray-700">No items in this queue</p>
          <p className="text-sm mt-1">
            {activeTab === "needs_review"
              ? "Run the scraper to discover new opportunities."
              : "Items will appear here as they move through the pipeline."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item) => (
            <QueueCard
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              onToggle={() => setSelected((prev) => {
                const next = new Set(prev);
                next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                return next;
              })}
              onNavigate={() => navigate(`/admin/editorial/${item.id}`)}
              onQuickReject={() => quickReject(item.id)}
              onQuickPublish={() => quickPublish(item)}
              onDelete={() => deleteItem(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
