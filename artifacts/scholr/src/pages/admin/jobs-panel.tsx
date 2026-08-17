import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, CheckCircle2, X, ExternalLink, Loader2, Star,
  MapPin, Clock, Building2, Eye, EyeOff,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  organization: string;
  location?: string | null;
  jobType?: string | null;
  category?: string | null;
  description?: string | null;
  salary?: string | null;
  deadline?: string | null;
  applicationLink?: string | null;
  status: string;
  sourceType: string;
  sourceName?: string | null;
  submitterName?: string | null;
  submitterEmail?: string | null;
  adminNotes?: string | null;
  featured: boolean;
  createdAt: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const TOKEN = () => localStorage.getItem("scholr_token") || "";
const STATUS_OPTIONS = ["pending", "published", "rejected", "expired"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  published: "bg-green-500/20 text-green-700 border-green-500/30",
  rejected: "bg-gray-100 text-gray-500 border-gray-200",
  expired: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function JobsPanel() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/jobs/admin/all" : `/api/jobs/admin/all?status=${filter}`;
      const res = await fetch(`${BASE}${url}`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch { toast({ title: "Error loading jobs", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const update = async (id: string, updates: Record<string, unknown>) => {
    setActioningId(id);
    try {
      const res = await fetch(`${BASE}/api/jobs/admin/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${TOKEN()}`, "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Updated" });
      load();
    } catch { toast({ title: "Update failed", variant: "destructive" }); }
    setActioningId(null);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    setActioningId(id);
    try {
      await fetch(`${BASE}/api/jobs/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      toast({ title: "Deleted" });
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
    setActioningId(null);
  };

  const pending = jobs.filter((j) => j.status === "pending").length;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 mb-1">Jobs Management</h1>
          <p className="text-muted-foreground text-sm">Review user-submitted jobs and scraped listings. Approve to publish.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {(["pending", "published", "rejected", "all"] as const).map((f) => (
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

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No {filter === "all" ? "" : filter} jobs</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className={`bg-card border rounded-2xl overflow-hidden transition-all ${
              job.status === "pending" ? "border-orange-500/30" :
              job.status === "published" ? "border-green-500/30" : "border-border"
            }`}>
              <div className="p-5">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-sm">{job.title}</p>
                      {job.featured && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>{job.organization}</span>
                      {job.location && <span className="flex items-center gap-0.5"><MapPin size={9} />{job.location}</span>}
                      {job.jobType && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{job.jobType}</Badge>}
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 border ${STATUS_COLORS[job.status] || ""}`}>{job.status}</Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{job.sourceType.replace("_", " ")}</Badge>
                    </div>
                    {job.submitterName && (
                      <p className="text-xs text-muted-foreground mt-1">Submitted by: {job.submitterName} ({job.submitterEmail})</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Expand"
                    >
                      <Eye size={14} />
                    </button>
                    {job.applicationLink && (
                      <a href={job.applicationLink} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {job.status === "pending" && (
                      <>
                        <button
                          onClick={() => update(job.id, { status: "rejected" })}
                          disabled={actioningId === job.id}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={() => update(job.id, { status: "published" })}
                          disabled={actioningId === job.id}
                          className="px-3 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-700 text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          {actioningId === job.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                          Publish
                        </button>
                      </>
                    )}
                    {job.status === "published" && (
                      <button
                        onClick={() => update(job.id, { featured: !job.featured })}
                        disabled={actioningId === job.id}
                        className={`p-1.5 rounded-lg transition-colors ${job.featured ? "text-yellow-500 bg-yellow-500/10" : "text-muted-foreground hover:bg-muted"}`}
                        title={job.featured ? "Unfeature" : "Feature"}
                      >
                        <Star size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => del(job.id)}
                      disabled={actioningId === job.id}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors text-xs"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>

              {expandedId === job.id && (
                <div className="border-t border-border bg-muted/30 p-5 space-y-4">
                  {job.description && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Description</p>
                      <p className="text-sm leading-relaxed">{job.description}</p>
                    </div>
                  )}
                  {job.deadline && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock size={11} /> Deadline: {job.deadline}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Status</p>
                    <Select value={job.status} onValueChange={(v) => update(job.id, { status: v })}>
                      <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Admin Notes</p>
                    <Textarea
                      rows={2}
                      className="text-sm"
                      placeholder="Internal notes..."
                      value={notes[job.id] ?? job.adminNotes ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [job.id]: e.target.value }))}
                    />
                    <Button size="sm" className="mt-2 h-7 text-xs" onClick={() => update(job.id, { adminNotes: notes[job.id] ?? "" })}>
                      Save Notes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
