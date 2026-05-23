import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, User, Calendar, MapPin, GraduationCap, MessageCircle,
  CheckCircle2, Clock, FileText, Loader2, Award, AlertCircle, Send
} from "lucide-react";

interface ApplicationDetail {
  id: string;
  status: string;
  motivation?: string | null;
  experience?: string | null;
  contactPreference?: string | null;
  whatsappNumber?: string | null;
  contactTime?: string | null;
  concerns?: string | null;
  notes?: string | null;
  documents?: string[] | null;
  timeline?: { date: string; event: string }[] | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string; name: string; email: string;
    nationality?: string | null; educationLevel?: string | null;
    gpa?: string | null; ieltsScore?: string | null; whatsappNumber?: string | null;
  } | null;
  opportunity: {
    id: string; title: string; slug: string;
    deadline: string | null; country: string | null; category: string | null;
  } | null;
  handler: { id: string; name: string } | null;
}

const STATUS_OPTIONS = [
  { value: "pending_review", label: "Pending Review" },
  { value: "profile_check", label: "Profile Check" },
  { value: "documents_collection", label: "Documents Collection" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_COLORS: Record<string, string> = {
  pending_review: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  profile_check: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  documents_collection: "bg-orange-500/20 text-orange-600 border-orange-500/30",
  in_progress: "bg-violet-500/20 text-violet-600 border-violet-500/30",
  submitted: "bg-green-500/20 text-green-600 border-green-500/30",
  accepted: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  rejected: "bg-gray-100 text-gray-500 border-gray-200",
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchApp(id: string): Promise<ApplicationDetail | null> {
  const token = localStorage.getItem("scholr_token");
  const res = await fetch(`${BASE}/api/applications/admin/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function updateApp(id: string, updates: { status?: string; notes?: string }) {
  const token = localStorage.getItem("scholr_token");
  const res = await fetch(`${BASE}/api/applications/admin/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export function AdminApplicationDetail({ id }: { id: string }) {
  const { toast } = useToast();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchApp(id).then((data) => {
      setApp(data);
      if (data) {
        setStatus(data.status);
        setNotes(data.notes || "");
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateApp(id, { status, notes });
      setApp(updated);
      toast({ title: "Updated!", description: "Application has been updated." });
    } catch {
      toast({ title: "Error", description: "Could not update application.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Application not found.</p>
        <Button asChild variant="outline" className="mt-4"><Link href="/admin/applications">← Back</Link></Button>
      </div>
    );
  }

  const whatsappUrl = app.whatsappNumber || app.student?.whatsappNumber
    ? `https://wa.me/${((app.whatsappNumber || app.student?.whatsappNumber || "").replace(/\D/g, ""))}?text=${encodeURIComponent(`Hi ${app.student?.name || ""}, this is the scholr team regarding your application for ${app.opportunity?.title || "the scholarship"}.`)}`
    : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Link href="/admin/applications"><ArrowLeft size={16} /> All Applications</Link>
        </Button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">{app.opportunity?.title || "Application Detail"}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`border text-xs ${STATUS_COLORS[app.status] || ""}`}>{STATUS_OPTIONS.find((s) => s.value === app.status)?.label || app.status}</Badge>
            <span className="text-xs text-muted-foreground">Received {new Date(app.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Student & Application Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Info */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-primary" />
              <h2 className="font-semibold">Student Profile</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground text-xs mb-0.5">Name</p><p className="font-medium">{app.student?.name}</p></div>
              <div><p className="text-muted-foreground text-xs mb-0.5">Email</p><p className="font-medium break-all">{app.student?.email}</p></div>
              {app.student?.nationality && <div><p className="text-muted-foreground text-xs mb-0.5">Nationality</p><p className="font-medium">{app.student.nationality}</p></div>}
              {app.student?.educationLevel && <div><p className="text-muted-foreground text-xs mb-0.5">Education</p><p className="font-medium">{app.student.educationLevel}</p></div>}
              {app.student?.gpa && <div><p className="text-muted-foreground text-xs mb-0.5">GPA</p><p className="font-medium">{app.student.gpa}</p></div>}
              {app.student?.ieltsScore && <div><p className="text-muted-foreground text-xs mb-0.5">IELTS</p><p className="font-medium">{app.student.ieltsScore}</p></div>}
              {(app.whatsappNumber || app.student?.whatsappNumber) && (
                <div><p className="text-muted-foreground text-xs mb-0.5">WhatsApp</p><p className="font-medium">{app.whatsappNumber || app.student?.whatsappNumber}</p></div>
              )}
              {app.contactPreference && <div><p className="text-muted-foreground text-xs mb-0.5">Contact Preference</p><p className="font-medium capitalize">{app.contactPreference}</p></div>}
              {app.contactTime && <div><p className="text-muted-foreground text-xs mb-0.5">Best Time</p><p className="font-medium capitalize">{app.contactTime}</p></div>}
            </div>
          </section>

          {/* Application Content */}
          {(app.motivation || app.experience || app.concerns) && (
            <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className="text-primary" />
                <h2 className="font-semibold">Application Details</h2>
              </div>
              {app.motivation && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Motivation</p>
                  <p className="text-sm leading-relaxed">{app.motivation}</p>
                </div>
              )}
              {app.experience && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Relevant Experience</p>
                  <p className="text-sm leading-relaxed">{app.experience}</p>
                </div>
              )}
              {app.concerns && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Concerns / Questions</p>
                  <p className="text-sm leading-relaxed">{app.concerns}</p>
                </div>
              )}
            </section>
          )}

          {/* Timeline */}
          {app.timeline && app.timeline.length > 0 && (
            <section className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-4">Timeline</h2>
              <div className="space-y-3">
                {app.timeline.map((t, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{t.event}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT — Actions Panel */}
        <div className="space-y-4">
          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Actions</h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Internal Notes (not visible to student)</p>
                <Textarea
                  rows={4}
                  placeholder="Add notes about this application..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : "Save Changes"}
              </Button>
            </div>
          </section>

          {whatsappUrl && (
            <Button asChild variant="outline" className="w-full border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366] gap-2">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} />
                Message on WhatsApp
              </a>
            </Button>
          )}

          {app.opportunity?.slug && (
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href={`/opportunity/${app.opportunity.slug}`} target="_blank">
                View Opportunity
              </Link>
            </Button>
          )}

          {/* Quick status buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="text-green-600 border-green-200" onClick={() => { setStatus("submitted"); setTimeout(handleSave, 100); }}>
              <CheckCircle2 size={14} className="mr-1" /> Mark Submitted
            </Button>
            <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-200" onClick={() => { setStatus("accepted"); setTimeout(handleSave, 100); }}>
              <Award size={14} className="mr-1" /> Accepted 🎉
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
