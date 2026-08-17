import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Briefcase, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Remote", "Volunteer"];
const CATEGORIES = ["Technology", "Health", "Education", "Finance", "NGO", "Government", "Engineering", "Legal", "Marketing", "Agriculture", "Other"];

interface JobSubmitModalProps { onClose: () => void; }

export function JobSubmitModal({ onClose }: JobSubmitModalProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", organization: "", location: "Kigali, Rwanda",
    jobType: "Full-time", category: "Technology",
    description: "", requirements: "", applicationLink: "",
    contactEmail: "", salary: "", deadline: "",
    submitterName: "", submitterEmail: "", submitterOrg: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.organization || !form.description || !form.submitterName || !form.submitterEmail) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/jobs/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      toast({ title: "Error", description: "Submission failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10">
          <X size={20} />
        </button>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="font-serif text-xl font-bold mb-2">Job Submitted!</h2>
            <p className="text-muted-foreground text-sm mb-6">Our team will review your job posting within 24–48 hours. Once approved, it will appear in the Jobs section.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold">Post a Job</h2>
                <p className="text-xs text-muted-foreground">Free — reviewed within 24–48h</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Job Title *</Label>
                <Input placeholder="e.g. Software Engineer" value={form.title} onChange={(e) => set("title", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Organization *</Label>
                <Input placeholder="e.g. RwandAir" value={form.organization} onChange={(e) => set("organization", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input placeholder="e.g. Kigali, Rwanda" value={form.location} onChange={(e) => set("location", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Job Type</Label>
                <Select value={form.jobType} onValueChange={(v) => set("jobType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Salary (optional)</Label>
                <Input placeholder="e.g. RWF 500k/month or Negotiable" value={form.salary} onChange={(e) => set("salary", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Job Description *</Label>
              <Textarea rows={4} placeholder="Describe the role, responsibilities, and what you're looking for..." value={form.description} onChange={(e) => set("description", e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label>Requirements (optional)</Label>
              <Textarea rows={3} placeholder="Education, experience, skills required..." value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Application Link</Label>
                <Input placeholder="https://..." value={form.applicationLink} onChange={(e) => set("applicationLink", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Email</Label>
                <Input type="email" placeholder="hr@company.rw" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Application Deadline</Label>
                <Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Contact Info</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Your Name *</Label>
                  <Input placeholder="Full name" value={form.submitterName} onChange={(e) => set("submitterName", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Your Email *</Label>
                  <Input type="email" placeholder="you@company.rw" value={form.submitterEmail} onChange={(e) => set("submitterEmail", e.target.value)} required />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Job for Review"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
