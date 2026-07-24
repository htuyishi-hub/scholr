import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, ExternalLink, Save, CheckCircle2, X, Clock,
  Image as ImageIcon, Globe, GraduationCap, Briefcase,
  AlertCircle, CheckCircle, ChevronRight, Loader2, History,
  Info, Star, FileText, Tag, Users, CalendarDays, Link2,
  StickyNote, Shield, Eye, RotateCcw,
} from "lucide-react";
import { computeQuality, scoreBg, scoreColor, scoreLabel, STATUS_META } from "@/lib/quality-score";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContentSections {
  overview?: string;
  benefits?: string;
  eligibility?: string;
  requirements?: string;
  documents?: string;
  applicationProcess?: string;
  importantDates?: string;
  fundingDetails?: string;
  location?: string;
  contactInfo?: string;
  faq?: string;
  additionalNotes?: string;
}

interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: string;
  actorId?: string;
  description: string;
  fromStatus?: string;
  toStatus?: string;
}

interface ScrapedItem {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  itemType: "scholarship" | "job";
  status: string;
  description?: string | null;
  content?: string | null;
  plainText?: string | null;
  deadline?: string | null;
  country?: string | null;
  category?: string | null;
  applyLink?: string | null;
  coverImage?: string | null;
  images?: string[] | null;
  qualityScore?: number | null;
  qualityIssues?: Array<{ check: string; status: "pass" | "warn" | "fail"; message: string; recommendation?: string }> | null;
  sections?: ContentSections | null;
  tags?: string[] | null;
  opportunityType?: string | null;
  academicLevel?: string[] | null;
  eligibleNationalities?: string[] | null;
  language?: string | null;
  duration?: string | null;
  salary?: string | null;
  internalNotes?: string | null;
  rejectionReason?: string | null;
  scheduledAt?: string | null;
  auditEvents?: AuditEvent[] | null;
  scrapedAt: string;
  updatedAt?: string | null;
  extractionMethod?: string | null;
  confidence?: string | null;
  opportunityId?: string | null;
  jobId?: string | null;
}

type Tab = "content" | "sections" | "media" | "metadata" | "eligibility" | "audit";

// ── API helpers ───────────────────────────────────────────────────────────────

const BASE = () => (import.meta.env.BASE_URL || "").replace(/\/$/, "");
const TOKEN = () => localStorage.getItem("scholr_token") || "";

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE()}/api${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN()}`,
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QualityCard({ item, formState }: { item: ScrapedItem; formState: Partial<ScrapedItem> }) {
  const merged = { ...item, ...formState };
  const { score, issues } = computeQuality(merged as any);
  const [expanded, setExpanded] = useState(false);
  const passes = issues.filter((i) => i.status === "pass").length;
  const fails = issues.filter((i) => i.status === "fail").length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</div>
          <div>
            <div className="text-xs font-semibold text-gray-700">{scoreLabel(score)}</div>
            <div className="text-[10px] text-muted-foreground">{passes} checks passed · {fails} failed</div>
          </div>
        </div>
        <div className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${scoreBg(score)}`}>
          {score}/100
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-400"}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Issues list */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-2">
          {issues.map((issue) => (
            <div key={issue.check} className="flex items-start gap-2.5">
              {issue.status === "pass" && <CheckCircle size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />}
              {issue.status === "warn" && <AlertCircle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />}
              {issue.status === "fail" && <X size={13} className="text-red-500 mt-0.5 flex-shrink-0" />}
              <div>
                <p className="text-xs text-gray-700">{issue.message}</p>
                {issue.recommendation && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{issue.recommendation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!expanded && fails > 0 && (
        <div className="border-t border-gray-100 px-4 pb-3">
          <div className="space-y-1.5 mt-2">
            {issues
              .filter((i) => i.status === "fail")
              .slice(0, 3)
              .map((issue) => (
                <div key={issue.check} className="flex items-start gap-2">
                  <X size={11} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-gray-600">{issue.recommendation ?? issue.message}</p>
                </div>
              ))}
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="text-[10px] text-primary hover:underline mt-2"
          >
            Show all {issues.length} checks
          </button>
        </div>
      )}
    </div>
  );
}

function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <History size={28} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No audit events yet</p>
      </div>
    );
  }

  const eventIcon = (type: string) => {
    switch (type) {
      case "published": return <CheckCircle2 size={13} className="text-emerald-500" />;
      case "rejected": return <X size={13} className="text-red-500" />;
      case "status_changed": return <ChevronRight size={13} className="text-blue-500" />;
      case "field_edited": return <FileText size={13} className="text-gray-500" />;
      case "image_changed": return <ImageIcon size={13} className="text-purple-500" />;
      case "note_added": return <StickyNote size={13} className="text-amber-500" />;
      default: return <Info size={13} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-3">
      {[...events].reverse().map((event) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mt-0.5">
            {eventIcon(event.eventType)}
          </div>
          <div className="flex-1 pb-3 border-b border-gray-100 last:border-0">
            <p className="text-sm text-gray-700">{event.description}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {new Date(event.timestamp).toLocaleString("en-US", {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EditorialItem({ id }: { id: string }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [item, setItem] = useState<ScrapedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [form, setForm] = useState<Partial<ScrapedItem>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showSourceIframe, setShowSourceIframe] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItem = useCallback(async () => {
    try {
      const data = await apiFetch(`/scraper/items/${id}`);
      setItem(data);
      setForm({});
      setIsDirty(false);
    } catch {
      toast({ title: "Item not found", variant: "destructive" });
      navigate("/admin/editorial");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  const updateForm = (updates: Partial<ScrapedItem>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const updateSection = (key: keyof ContentSections, value: string) => {
    setForm((prev) => ({
      ...prev,
      sections: { ...(prev.sections ?? item?.sections ?? {}), [key]: value },
    }));
    setIsDirty(true);
  };

  const save = async () => {
    if (!item || !isDirty) return;
    setSaving(true);
    try {
      const updated = await apiFetch(`/scraper/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setItem(updated);
      setForm({});
      setIsDirty(false);
      toast({ title: "Saved ✓" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
    setSaving(false);
  };

  const changeStatus = async (status: string, extra?: Record<string, unknown>) => {
    if (!item) return;
    setStatusChanging(true);
    try {
      await apiFetch(`/scraper/items/${item.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, ...extra }),
      });
      setItem((prev) => prev ? { ...prev, status } : prev);
      toast({ title: `Status → ${STATUS_META[status]?.label ?? status}` });
    } catch {
      toast({ title: "Status update failed", variant: "destructive" });
    }
    setStatusChanging(false);
  };

  const publish = async () => {
    if (!item) return;
    setSaving(true);
    // Save unsaved changes first
    if (isDirty) {
      try {
        const updated = await apiFetch(`/scraper/items/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        setItem(updated);
        setForm({});
        setIsDirty(false);
      } catch { /* continue anyway */ }
    }
    try {
      const merged = { ...item, ...form };
      await apiFetch(`/scraper/items/${item.id}/approve`, {
        method: "PUT",
        body: JSON.stringify(merged),
      });
      toast({ title: "Published successfully ✓" });
      fetchItem();
    } catch {
      toast({ title: "Publish failed", variant: "destructive" });
    }
    setSaving(false);
  };

  const reject = async () => {
    if (!item) return;
    await apiFetch(`/scraper/items/${item.id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason: rejectReason }),
    });
    toast({ title: "Rejected" });
    setShowRejectModal(false);
    fetchItem();
  };

  const selectCoverImage = (url: string) => {
    updateForm({ coverImage: url });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!item) return null;

  const merged = { ...item, ...form };
  const statusMeta = STATUS_META[merged.status] ?? STATUS_META["needs_review"];
  const isPublished = ["published", "approved"].includes(merged.status);
  const isRejected = merged.status === "rejected";
  const canPublish = !isPublished && !isRejected;
  const allImages = merged.images ?? [];
  const sections = merged.sections ?? {};
  const auditEvents = item.auditEvents ?? [];

  const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: "content",    label: "Content",    icon: FileText },
    { id: "sections",   label: "Sections",   icon: Star },
    { id: "media",      label: "Media",      icon: ImageIcon },
    { id: "metadata",   label: "Metadata",   icon: Tag },
    { id: "eligibility",label: "Eligibility",icon: Users },
    { id: "audit",      label: "Audit",      icon: History },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-gray-200 -mx-8 px-8 py-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Back */}
          <Link href="/admin/editorial" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-800 transition-colors flex-shrink-0">
            <ArrowLeft size={14} />
            Queue
          </Link>

          <span className="text-gray-300 flex-shrink-0">/</span>

          {/* Title */}
          <span className="text-sm font-medium text-gray-800 truncate flex-1 min-w-0">
            {merged.title}
          </span>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${statusMeta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </span>

          {/* Unsaved indicator */}
          {isDirty && (
            <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">
              Unsaved changes
            </span>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {isDirty && (
              <Button size="sm" variant="outline" onClick={save} disabled={saving} className="h-8 text-xs gap-1.5 border-gray-200">
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                Save
              </Button>
            )}

            {canPublish && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectModal(true)}
                  className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X size={11} className="mr-1" /> Reject
                </Button>
                <Button
                  size="sm"
                  onClick={publish}
                  disabled={saving}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                  Publish
                </Button>
              </>
            )}

            {isPublished && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => changeStatus("archived")}
                disabled={statusChanging}
                className="h-8 text-xs border-gray-200"
              >
                Archive
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Editor ── */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="flex gap-0.5 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-muted-foreground hover:text-gray-700"
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── CONTENT tab ── */}
          {activeTab === "content" && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Title</label>
                <Input
                  value={merged.title ?? ""}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  className="font-medium border-gray-200"
                  placeholder="Opportunity title"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Description</label>
                <Textarea
                  value={merged.description ?? ""}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  rows={3}
                  className="border-gray-200 resize-none text-sm"
                  placeholder="Short summary shown in cards and search results…"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                  Full Content
                  <span className="ml-2 text-[10px] text-muted-foreground font-normal normal-case">Accepts HTML</span>
                </label>
                <Textarea
                  value={merged.content ?? ""}
                  onChange={(e) => updateForm({ content: e.target.value })}
                  rows={18}
                  className="border-gray-200 text-sm font-mono leading-relaxed"
                  placeholder="Full opportunity content (HTML or plain text)…"
                />
                {merged.content && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {merged.content.length.toLocaleString()} characters
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── SECTIONS tab ── */}
          {activeTab === "sections" && (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                Structured sections enable advanced filtering, AI search, and personalized recommendations. Each section is displayed independently on the opportunity page.
              </p>
              {(
                [
                  { key: "overview",           label: "Overview",             rows: 4 },
                  { key: "eligibility",         label: "Eligibility",          rows: 4 },
                  { key: "benefits",            label: "Benefits & Funding",   rows: 4 },
                  { key: "requirements",        label: "Requirements",         rows: 3 },
                  { key: "documents",           label: "Required Documents",   rows: 3 },
                  { key: "applicationProcess",  label: "Application Process",  rows: 4 },
                  { key: "importantDates",      label: "Important Dates",      rows: 3 },
                  { key: "fundingDetails",      label: "Funding Details",      rows: 3 },
                  { key: "location",            label: "Location & Duration",  rows: 2 },
                  { key: "contactInfo",         label: "Contact Information",  rows: 2 },
                  { key: "faq",                 label: "FAQ",                  rows: 4 },
                  { key: "additionalNotes",     label: "Additional Notes",     rows: 3 },
                ] as const
              ).map(({ key, label, rows }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">{label}</label>
                  <Textarea
                    value={sections[key as keyof ContentSections] ?? ""}
                    onChange={(e) => updateSection(key as keyof ContentSections, e.target.value)}
                    rows={rows}
                    className="border-gray-200 text-sm resize-none"
                    placeholder={`${label} content…`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── MEDIA tab ── */}
          {activeTab === "media" && (
            <div className="space-y-6">
              {/* Cover image */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 block">Cover Image</label>
                {merged.coverImage ? (
                  <div className="relative group">
                    <img
                      src={merged.coverImage}
                      alt="Cover"
                      className="w-full h-52 object-cover rounded-xl border border-gray-200"
                      onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateForm({ coverImage: "" })}
                        className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon size={24} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No cover image — select one from gallery below</p>
                    </div>
                  </div>
                )}
                <div className="mt-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Or paste image URL</label>
                  <Input
                    value={merged.coverImage ?? ""}
                    onChange={(e) => updateForm({ coverImage: e.target.value })}
                    placeholder="https://…"
                    className="text-xs border-gray-200 h-8"
                  />
                </div>
              </div>

              {/* Gallery */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 block">
                  Image Gallery
                  <span className="ml-2 text-[10px] font-normal text-muted-foreground normal-case">{allImages.length} images · click to set as cover</span>
                </label>
                {allImages.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {allImages.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectCoverImage(url)}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          merged.coverImage === url ? "border-primary shadow-md" : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-20 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                        />
                        {merged.coverImage === url && (
                          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                            <Star size={14} className="text-primary fill-primary" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-[9px] font-medium">Set cover</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <ImageIcon size={20} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No images extracted from source</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── METADATA tab ── */}
          {activeTab === "metadata" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Deadline</label>
                  <Input
                    type="date"
                    value={merged.deadline ?? ""}
                    onChange={(e) => updateForm({ deadline: e.target.value })}
                    className="border-gray-200 h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Country</label>
                  <Input
                    value={merged.country ?? ""}
                    onChange={(e) => updateForm({ country: e.target.value })}
                    placeholder="e.g. United Kingdom"
                    className="border-gray-200 h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Category</label>
                  <Select value={merged.category ?? ""} onValueChange={(v) => updateForm({ category: v })}>
                    <SelectTrigger className="border-gray-200 h-9 text-sm">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Scholarships", "Fellowships", "Grants", "Internships", "Jobs", "Research", "Competitions", "Conferences", "Exchange Programs", "Training Programs"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Opportunity Type</label>
                  <Input
                    value={merged.opportunityType ?? ""}
                    onChange={(e) => updateForm({ opportunityType: e.target.value })}
                    placeholder="e.g. Fully Funded"
                    className="border-gray-200 h-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Application Link</label>
                <div className="flex gap-2">
                  <Input
                    value={merged.applyLink ?? ""}
                    onChange={(e) => updateForm({ applyLink: e.target.value })}
                    placeholder="https://…"
                    className="border-gray-200 text-sm flex-1"
                  />
                  {merged.applyLink && (
                    <a href={merged.applyLink} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 h-9 px-2.5 rounded-md border border-gray-200 flex items-center text-muted-foreground hover:text-gray-700 transition-colors">
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Tags</label>
                <Input
                  value={(merged.tags ?? []).join(", ")}
                  onChange={(e) => updateForm({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                  placeholder="e.g. Africa, STEM, Graduate"
                  className="border-gray-200 text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Comma-separated</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Duration</label>
                  <Input
                    value={merged.duration ?? ""}
                    onChange={(e) => updateForm({ duration: e.target.value })}
                    placeholder="e.g. 1 year, 3 months"
                    className="border-gray-200 h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Language</label>
                  <Input
                    value={merged.language ?? ""}
                    onChange={(e) => updateForm({ language: e.target.value })}
                    placeholder="e.g. English"
                    className="border-gray-200 h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Salary / Stipend</label>
                  <Input
                    value={merged.salary ?? ""}
                    onChange={(e) => updateForm({ salary: e.target.value })}
                    placeholder="e.g. $20,000/year"
                    className="border-gray-200 h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── ELIGIBILITY tab ── */}
          {activeTab === "eligibility" && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Academic Level</label>
                <div className="flex flex-wrap gap-2">
                  {["High School", "Undergraduate", "Master's", "PhD", "Postdoctoral", "Professional", "Any"].map((level) => {
                    const selected = (merged.academicLevel ?? []).includes(level);
                    return (
                      <button
                        key={level}
                        onClick={() => {
                          const current = merged.academicLevel ?? [];
                          updateForm({
                            academicLevel: selected ? current.filter((l) => l !== level) : [...current, level],
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Eligible Nationalities</label>
                <Input
                  value={(merged.eligibleNationalities ?? []).join(", ")}
                  onChange={(e) => updateForm({
                    eligibleNationalities: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })}
                  placeholder="e.g. All nationalities, African citizens, Nigerian"
                  className="border-gray-200 text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Comma-separated. Leave blank for all nationalities.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Additional Eligibility Notes</label>
                <Textarea
                  value={sections.eligibility ?? ""}
                  onChange={(e) => updateSection("eligibility", e.target.value)}
                  rows={6}
                  className="border-gray-200 text-sm resize-none"
                  placeholder="Detailed eligibility requirements…"
                />
              </div>
            </div>
          )}

          {/* ── AUDIT tab ── */}
          {activeTab === "audit" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Audit Timeline</h3>
                <span className="text-xs text-muted-foreground">{auditEvents.length} event{auditEvents.length !== 1 ? "s" : ""}</span>
              </div>
              <AuditTimeline events={auditEvents} />
            </div>
          )}

          {/* Save bar */}
          {isDirty && (
            <div className="mt-6 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-sm text-amber-700">You have unsaved changes</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setForm({}); setIsDirty(false); }} className="h-7 text-xs border-amber-200">
                  <RotateCcw size={10} className="mr-1" /> Discard
                </Button>
                <Button size="sm" onClick={save} disabled={saving} className="h-7 text-xs">
                  {saving ? <Loader2 size={10} className="animate-spin mr-1" /> : <Save size={10} className="mr-1" />}
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quality score */}
          <QualityCard item={item} formState={form} />

          {/* Publishing controls */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Publishing</h3>

            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Pipeline status</label>
              <Select value={merged.status} onValueChange={(v) => changeStatus(v)} disabled={statusChanging}>
                <SelectTrigger className="border-gray-200 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: "needs_review",        label: "Needs Review" },
                    { value: "needs_images",         label: "Needs Images" },
                    { value: "needs_metadata",       label: "Needs Metadata" },
                    { value: "needs_verification",   label: "Needs Verification" },
                    { value: "scheduled",            label: "Scheduled" },
                    { value: "archived",             label: "Archived" },
                    { value: "rejected",             label: "Rejected" },
                  ].map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {canPublish && (
              <>
                <Button
                  onClick={publish}
                  disabled={saving}
                  className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                  Publish Now
                </Button>

                <div className="relative">
                  <button
                    onClick={() => setShowSchedule((v) => !v)}
                    className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-gray-700 py-1"
                  >
                    <span className="flex items-center gap-1.5"><CalendarDays size={11} /> Schedule for later</span>
                    <ChevronRight size={11} className={`transition-transform ${showSchedule ? "rotate-90" : ""}`} />
                  </button>
                  {showSchedule && (
                    <div className="mt-2 flex gap-2">
                      <Input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="h-7 text-xs border-gray-200 flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs flex-shrink-0 border-gray-200"
                        onClick={() => changeStatus("scheduled", { scheduledAt: scheduleDate })}
                        disabled={!scheduleDate || statusChanging}
                      >
                        Set
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowRejectModal(true)}
                  className="w-full h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X size={11} className="mr-1" /> Reject
                </Button>
              </>
            )}

            {isPublished && (
              <div className="text-center py-2">
                <div className="flex items-center justify-center gap-1.5 text-emerald-600 mb-1">
                  <CheckCircle size={14} />
                  <span className="text-xs font-medium">Published</span>
                </div>
                {item.opportunityId && (
                  <Link
                    href={`/admin/posts/${item.opportunityId}/edit`}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Edit published opportunity →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Source info */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Source</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Publisher</span>
                <span className="text-xs font-medium text-gray-700">{item.source}</span>
              </div>
              {item.extractionMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Extraction</span>
                  <span className="text-xs text-gray-600 capitalize">{item.extractionMethod}</span>
                </div>
              )}
              {item.confidence && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Confidence</span>
                  <span className="text-xs text-gray-600">{Math.round(Number(item.confidence))}%</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Scraped</span>
                <span className="text-xs text-gray-600">
                  {new Date(item.scrapedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={11} /> Open source
              </a>
              <button
                onClick={() => setShowSourceIframe((v) => !v)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Eye size={11} /> {showSourceIframe ? "Hide" : "Preview"}
              </button>
            </div>
            {showSourceIframe && (
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 h-64">
                <iframe
                  src={item.sourceUrl}
                  title="Source preview"
                  className="w-full h-full"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            )}
          </div>

          {/* Internal notes */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Internal Notes</h3>
            <Textarea
              value={merged.internalNotes ?? ""}
              onChange={(e) => updateForm({ internalNotes: e.target.value })}
              rows={3}
              className="border-gray-200 text-xs resize-none"
              placeholder="Notes visible only to editors…"
            />
          </div>

          {/* Item type / category info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Item Info</h3>
            <div className="flex items-center gap-2">
              {merged.itemType === "scholarship"
                ? <GraduationCap size={13} className="text-primary" />
                : <Briefcase size={13} className="text-blue-500" />
              }
              <span className="text-xs text-gray-700 capitalize">{merged.itemType}</span>
            </div>
            {merged.country && (
              <div className="flex items-center gap-2">
                <Globe size={13} className="text-muted-foreground" />
                <span className="text-xs text-gray-700">{merged.country}</span>
              </div>
            )}
            {merged.deadline && (
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-muted-foreground" />
                <span className="text-xs text-gray-700">Deadline: {merged.deadline}</span>
              </div>
            )}
            {merged.applyLink && (
              <div className="flex items-center gap-2">
                <Link2 size={13} className="text-muted-foreground" />
                <a href={merged.applyLink} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate">
                  Apply link ↗
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Reject modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-gray-900 mb-1">Reject this opportunity?</h2>
            <p className="text-sm text-muted-foreground mb-4">It will be moved to Rejected and hidden from the queue.</p>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Reason (optional)</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Duplicate, expired, low quality…"
              className="border-gray-200 text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRejectModal(false)} className="border-gray-200">
                Cancel
              </Button>
              <Button onClick={reject} className="bg-red-600 hover:bg-red-700 text-white">
                <X size={13} className="mr-1" /> Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
