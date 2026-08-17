import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw, CheckCircle2, X, ExternalLink, Globe, Loader2,
  GraduationCap, Briefcase, Clock, ChevronDown, ChevronUp, Trash2,
} from "lucide-react";

interface ScrapedItem {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  itemType: "scholarship" | "job";
  status: "pending" | "approved" | "rejected";
  description?: string | null;
  deadline?: string | null;
  country?: string | null;
  category?: string | null;
  applyLink?: string | null;
  scrapedAt: string;
}

interface ScrapeRunResult { source: string; count: number; error?: string; }

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const TOKEN = () => localStorage.getItem("scholr_token") || "";

async function apiGet(path: string) {
  const res = await fetch(`${BASE}/api${path}`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}
async function apiPut(path: string, body?: unknown) {
  const res = await fetch(`${BASE}/api${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${TOKEN()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}
async function apiPost(path: string, body?: unknown) {
  const res = await fetch(`${BASE}/api${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}
async function apiDelete(path: string) {
  const res = await fetch(`${BASE}/api${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN()}` },
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export function ScraperPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState<ScrapedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [lastRun, setLastRun] = useState<{ added: number; duplicates: number; summary: ScrapeRunResult[] } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ScrapedItem & { deadline: string }>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet(filter === "all" ? "/scraper/items" : `/scraper/items?status=${filter}`);
      setItems(data);
    } catch { toast({ title: "Error loading items", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const runScraper = async () => {
    setRunning(true);
    try {
      const result = await apiPost("/scraper/run");
      setLastRun(result);
      setShowSummary(true);
      toast({ title: `Scrape complete — ${result.added} new items found` });
      load();
    } catch { toast({ title: "Scrape failed", variant: "destructive" }); }
    setRunning(false);
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      await apiDelete("/scraper/items");
      setItems([]);
      setLastRun(null);
      toast({ title: "All scraped data cleared" });
    } catch { toast({ title: "Failed to clear data", variant: "destructive" }); }
    setClearing(false);
  };

  const clearAndRerun = async () => {
    setClearing(true);
    try {
      await apiDelete("/scraper/items");
      setItems([]);
      setLastRun(null);
      toast({ title: "Cleared — starting fresh scrape…" });
    } catch {
      toast({ title: "Failed to clear data", variant: "destructive" });
      setClearing(false);
      return;
    }
    setClearing(false);
    // Now run the scraper
    setRunning(true);
    try {
      const result = await apiPost("/scraper/run");
      setLastRun(result);
      setShowSummary(true);
      toast({ title: `Scrape complete — ${result.added} new items found` });
      load();
    } catch { toast({ title: "Scrape failed", variant: "destructive" }); }
    setRunning(false);
  };

  const approve = async (item: ScrapedItem) => {
    setActioningId(item.id);
    try {
      const overrides = editingId === item.id ? editForm : {};
      const result = await apiPut(`/scraper/items/${item.id}/approve`, overrides);
      toast({ title: `✓ Approved — ${result.created} created` });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setEditingId(null);
    } catch { toast({ title: "Approval failed", variant: "destructive" }); }
    setActioningId(null);
  };

  const reject = async (id: string) => {
    setActioningId(id);
    try {
      await apiPut(`/scraper/items/${id}/reject`);
      toast({ title: "Rejected" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { toast({ title: "Rejection failed", variant: "destructive" }); }
    setActioningId(null);
  };

  const pending = items.filter((i) => i.status === "pending").length;
  const busy = running || clearing;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 mb-1">Content Scraper</h1>
          <p className="text-muted-foreground text-sm">Fetch scholarships and jobs from sources. Review items before publishing.</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Clear All */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={busy} className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all scraped data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete every item in the scraper queue — pending, approved, and rejected. Published opportunities are not affected. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearAll} className="bg-red-600 hover:bg-red-700">
                  Yes, delete all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Clear & Rerun */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={busy} className="gap-2">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14} /><RefreshCw size={14} /></>}
                {clearing ? "Clearing…" : running ? "Scraping…" : "Clear & Rerun"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all data and run a fresh scrape?</AlertDialogTitle>
                <AlertDialogDescription>
                  All items in the queue will be deleted, then the scraper will run immediately to fetch fresh content. Published opportunities are not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearAndRerun}>
                  Clear & Rerun
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Run scraper */}
          <Button onClick={runScraper} disabled={busy} className="gap-2">
            {running ? <><Loader2 size={14} className="animate-spin" /> Scraping…</> : <><RefreshCw size={14} /> Run Scraper</>}
          </Button>
        </div>
      </div>

      {/* Last run summary */}
      {lastRun && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <button className="w-full flex items-center justify-between" onClick={() => setShowSummary((v) => !v)}>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="font-medium text-sm">Last run: {lastRun.added} new items found, {lastRun.duplicates} duplicates skipped</span>
            </div>
            {showSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showSummary && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {lastRun.summary.map((s) => (
                <div key={s.source} className="bg-muted/40 rounded-xl p-2 text-xs">
                  <p className="font-medium truncate">{s.source}</p>
                  <p className={s.error ? "text-red-400" : "text-muted-foreground"}>
                    {s.error ? "Failed" : `${s.count} items`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pending > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Items */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Globe size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No {filter === "all" ? "" : filter} items</p>
          <p className="text-sm mt-1">Run the scraper to fetch new content.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className={`bg-card border rounded-2xl p-5 transition-all ${
              item.status === "pending" ? "border-orange-500/30" :
              item.status === "approved" ? "border-green-500/30" : "border-border opacity-60"
            }`}>
              <div className="flex items-start gap-3 flex-wrap">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.itemType === "scholarship" ? "bg-primary/10" : "bg-blue-500/10"
                }`}>
                  {item.itemType === "scholarship"
                    ? <GraduationCap size={16} className="text-primary" />
                    : <Briefcase size={16} className="text-blue-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <Input
                      className="mb-2 font-medium"
                      value={editForm.title ?? item.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium text-sm leading-snug mb-0.5">{item.title}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">{item.source}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{item.itemType}</Badge>
                    {item.status !== "pending" && (
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 ${item.status === "approved" ? "bg-green-500/20 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {item.status}
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  )}
                  {editingId === item.id && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Deadline</label>
                        <Input
                          type="date"
                          className="h-8 text-xs mt-0.5"
                          value={editForm.deadline ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, deadline: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Apply Link</label>
                        <Input
                          className="h-8 text-xs mt-0.5"
                          placeholder="https://..."
                          value={editForm.applyLink ?? item.applyLink ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, applyLink: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="View source">
                    <ExternalLink size={13} />
                  </a>
                  {item.status === "pending" && (
                    <>
                      <button
                        onClick={() => { setEditingId(editingId === item.id ? null : item.id); setEditForm({}); }}
                        className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        {editingId === item.id ? "Cancel" : "Edit"}
                      </button>
                      <button
                        onClick={() => reject(item.id)}
                        disabled={actioningId === item.id}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                        title="Reject"
                      >
                        {actioningId === item.id ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                      </button>
                      <button
                        onClick={() => approve(item)}
                        disabled={actioningId === item.id}
                        className="px-3 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-700 text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        {actioningId === item.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 pl-11">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock size={9} /> {new Date(item.scrapedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                {item.deadline && <span className="text-[10px] text-muted-foreground">Deadline: {item.deadline}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
