import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Filter, Eye, ChevronRight, Clock, CheckCircle2,
  FileText, Loader2, Award, AlertCircle, Inbox
} from "lucide-react";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  whatsappNumber?: string | null;
  student: { id: string; name: string; email: string; nationality?: string | null; educationLevel?: string | null } | null;
  opportunity: { id: string; title: string; slug: string; deadline: string | null; country: string | null } | null;
  handler: { id: string; name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending_review: { label: "Pending Review", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30", icon: Clock },
  profile_check: { label: "Profile Check", color: "bg-blue-500/20 text-blue-600 border-blue-500/30", icon: FileText },
  documents_collection: { label: "Documents", color: "bg-orange-500/20 text-orange-600 border-orange-500/30", icon: FileText },
  in_progress: { label: "In Progress", color: "bg-violet-500/20 text-violet-600 border-violet-500/30", icon: Loader2 },
  submitted: { label: "Submitted", color: "bg-green-500/20 text-green-600 border-green-500/30", icon: CheckCircle2 },
  accepted: { label: "Accepted", color: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30", icon: Award },
  rejected: { label: "Rejected", color: "bg-gray-100 text-gray-500 border-gray-200", icon: AlertCircle },
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchApplications(status?: string): Promise<Application[]> {
  const token = localStorage.getItem("scholr_token");
  const params = status && status !== "all" ? `?status=${status}` : "";
  const res = await fetch(`${BASE}/api/applications/admin/all${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = async (status?: string) => {
    setLoading(true);
    const data = await fetchApplications(status === "all" ? undefined : status);
    setApplications(data);
    setLoading(false);
  };

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  const filtered = applications.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.student?.name?.toLowerCase().includes(q) ||
      a.opportunity?.title?.toLowerCase().includes(q) ||
      a.student?.email?.toLowerCase().includes(q)
    );
  });

  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage student-assisted applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">{applications.length} total</Badge>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[["all", "All"], ["pending_review", "New"], ["in_progress", "In Progress"], ["submitted", "Submitted"], ["accepted", "Accepted"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${statusFilter === val ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-muted"}`}
          >
            {label}
            {val !== "all" && statusCounts[val] ? (
              <span className="ml-1.5 bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-xs font-bold">{statusCounts[val]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by student name, email, or opportunity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Inbox size={40} className="text-muted-foreground mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg mb-2">No applications yet</h3>
          <p className="text-muted-foreground text-sm">Applications from students using "Apply With Us" will appear here.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Student</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Opportunity</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Handler</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Date</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((app) => {
                  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending_review;
                  const Icon = cfg.icon;
                  return (
                    <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{app.student?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{app.student?.email}</p>
                          {app.student?.nationality && (
                            <p className="text-xs text-muted-foreground">{app.student.nationality}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium line-clamp-1 max-w-48">{app.opportunity?.title || "Unknown"}</p>
                        {app.opportunity?.country && (
                          <p className="text-xs text-muted-foreground">{app.opportunity.country}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`border text-xs ${cfg.color}`}>
                          <Icon size={10} className="mr-1" />{cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {app.handler?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <Button asChild size="sm" variant="ghost" className="gap-1">
                          <Link href={`/admin/applications/${app.id}`}>
                            <Eye size={14} /> Review
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
