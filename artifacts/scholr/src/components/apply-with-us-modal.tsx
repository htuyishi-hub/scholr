import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DocumentUploader } from "@/components/document-uploader";
import type { DocumentSlot } from "@/components/document-uploader";
import { useStudent, submitApplication } from "@/hooks/use-student-auth";
import {
  X, ChevronRight, CheckCircle2, Loader2, ExternalLink,
  GraduationCap, Calendar, FileText, Upload,
} from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  slug: string;
  applyLink?: string | null;
  deadline?: string | null;
  requiredDocuments?: string[] | null;
}

interface ApplyWithUsModalProps {
  opportunity: Opportunity;
  onClose: () => void;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const DEFAULT_DOCUMENTS: DocumentSlot[] = [
  { type: "cv", label: "CV / Resume", required: true },
  { type: "transcript", label: "Academic Transcript", required: true },
  { type: "passport", label: "Passport / National ID", required: true },
  { type: "photo", label: "Passport-size Photo", required: false },
  { type: "english_test", label: "English Test Score (IELTS/TOEFL)", required: false },
  { type: "recommendation", label: "Reference Letter", required: false },
];

const DOCUMENT_TYPES: Record<string, { label: string; required: boolean }> = {
  cv:             { label: "CV / Resume", required: true },
  transcript:     { label: "Academic Transcript", required: true },
  passport:       { label: "Passport / National ID", required: true },
  photo:          { label: "Passport-size Photo", required: false },
  english_test:   { label: "English Test Score (IELTS/TOEFL)", required: false },
  recommendation: { label: "Reference Letter", required: false },
  statement:      { label: "Personal Statement", required: false },
  certificate:    { label: "Certificate / Award", required: false },
  other:          { label: "Other Document", required: false },
};

function buildDocumentSlots(requiredDocuments?: string[] | null): DocumentSlot[] {
  if (!requiredDocuments || requiredDocuments.length === 0) return DEFAULT_DOCUMENTS;
  return requiredDocuments.map((type) => ({
    type,
    label: DOCUMENT_TYPES[type]?.label ?? type,
    required: DOCUMENT_TYPES[type]?.required ?? false,
  }));
}

async function saveDocuments(applicationId: string, documents: DocumentSlot[]) {
  const token = localStorage.getItem("scholr_student_token");
  const res = await fetch(`${BASE}/api/applications/${applicationId}/documents`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ documents }),
  });
  if (!res.ok) throw new Error("Failed to save documents");
  return res.json();
}

export function ApplyWithUsModal({ opportunity, onClose }: ApplyWithUsModalProps) {
  const { student } = useStudent();
  const [mode, setMode] = useState<"select" | "form" | "documents" | "success" | "login_prompt">("select");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingDocs, setSavingDocs] = useState(false);
  const [error, setError] = useState("");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [form, setForm] = useState({
    motivation: "",
    experience: "",
    contactPreference: "whatsapp",
    whatsappNumber: student?.whatsappNumber || "",
    contactTime: "morning",
    concerns: "",
  });

  const docSlots = buildDocumentSlots(opportunity.requiredDocuments);
  const [documents, setDocuments] = useState<DocumentSlot[]>(docSlots);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const daysUntilDeadline = opportunity.deadline
    ? Math.ceil((new Date(opportunity.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleApplyWithUs = () => {
    if (!student) { setMode("login_prompt"); return; }
    setMode("form");
  };

  const handleSubmitApplication = async () => {
    setLoading(true);
    setError("");
    try {
      const app = await submitApplication({
        opportunityId: opportunity.id,
        motivation: form.motivation,
        experience: form.experience,
        contactPreference: form.contactPreference,
        whatsappNumber: form.whatsappNumber,
        contactTime: form.contactTime,
        concerns: form.concerns,
      });
      setApplicationId(app.id);
      setMode("documents");
    } catch (e: unknown) {
      const msg = (e as Error).message || "";
      if (msg.includes("already applied")) {
        setError("You have already applied to this opportunity.");
      } else {
        setError(msg || "Submission failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUploaded = (slotIndex: number, objectPath: string, fileName: string, size: number) => {
    setDocuments((prev) => prev.map((d, i) =>
      i === slotIndex
        ? { ...d, objectPath, fileName, size, uploadedAt: new Date().toISOString() }
        : d
    ));
  };

  const handleDocumentRemoved = (slotIndex: number) => {
    setDocuments((prev) => prev.map((d, i) =>
      i === slotIndex
        ? { ...d, objectPath: null, fileName: null, size: null, uploadedAt: null }
        : d
    ));
  };

  const handleSaveDocuments = async (finish: boolean) => {
    if (!applicationId) return;
    setSavingDocs(true);
    try {
      await saveDocuments(applicationId, documents);
      if (finish) setMode("success");
    } catch (e: unknown) {
      setError((e as Error).message || "Failed to save documents");
    } finally {
      setSavingDocs(false);
    }
  };

  const requiredUploaded = documents.filter((d) => d.required && d.objectPath).length;
  const totalRequired = documents.filter((d) => d.required).length;
  const canFinish = requiredUploaded === totalRequired;
  const anyUploaded = documents.some((d) => d.objectPath);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10">
          <X size={20} />
        </button>

        {/* SELECT */}
        {mode === "select" && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-bold mb-1">How would you like to apply?</h2>
              <p className="text-muted-foreground text-sm line-clamp-2">{opportunity.title}</p>
              {opportunity.deadline && (
                <div className="flex items-center gap-1.5 mt-2 text-sm">
                  <Calendar size={13} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Deadline:</span>
                  <span className={`font-medium ${daysUntilDeadline !== null && daysUntilDeadline <= 14 ? "text-orange-400" : "text-foreground"}`}>
                    {new Date(opportunity.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    {daysUntilDeadline !== null && daysUntilDeadline > 0 && ` (${daysUntilDeadline}d)`}
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div
                className="border border-border rounded-xl p-5 hover:border-primary/40 transition-colors cursor-pointer group"
                onClick={() => { if (opportunity.applyLink) window.open(opportunity.applyLink, "_blank"); onClose(); }}
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                  <ExternalLink size={20} className="text-muted-foreground group-hover:text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Apply Directly</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Go to the official site and apply yourself</p>
              </div>
              <div
                className="border-2 border-primary/50 rounded-xl p-5 hover:border-primary bg-primary/5 cursor-pointer group"
                onClick={handleApplyWithUs}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
                  <GraduationCap size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Apply With Us</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">We guide you through the whole process</p>
                <div className="mt-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Recommended</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOGIN PROMPT */}
        {mode === "login_prompt" && (
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={28} className="text-primary" />
            </div>
            <h2 className="font-serif text-xl font-bold mb-2">Sign in to continue</h2>
            <p className="text-muted-foreground text-sm mb-6">Create a free account or sign in to apply with scholr's guidance.</p>
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full"><Link href="/register" onClick={onClose}>Create Free Account</Link></Button>
              <Button asChild variant="outline" className="w-full"><Link href="/login" onClick={onClose}>Sign In</Link></Button>
              <button onClick={() => setMode("select")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Go back</button>
            </div>
          </div>
        )}

        {/* APPLICATION FORM — 2 steps */}
        {mode === "form" && (
          <div className="p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-serif text-lg font-bold">Apply With Us</h2>
                <span className="text-xs text-muted-foreground">Step {step} of 2</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{opportunity.title}</p>
              <div className="flex gap-1 mt-3">
                <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
                <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm mb-4">{error}</div>}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Why do you want this scholarship? *</Label>
                  <Textarea className="mt-1" rows={4} placeholder="Tell us your motivation..." value={form.motivation} onChange={(e) => set("motivation", e.target.value)} />
                </div>
                <div>
                  <Label>Relevant experience or qualifications</Label>
                  <Textarea className="mt-1" rows={3} placeholder="Academic achievements, research, work experience..." value={form.experience} onChange={(e) => set("experience", e.target.value)} />
                </div>
                <Button className="w-full gap-2" onClick={() => setStep(2)} disabled={!form.motivation.trim()}>
                  Continue <ChevronRight size={16} />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Preferred contact method</Label>
                  <Select value={form.contactPreference} onValueChange={(v) => set("contactPreference", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.contactPreference === "whatsapp" && (
                  <div>
                    <Label>WhatsApp number</Label>
                    <Input className="mt-1" placeholder="+1234567890" value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} />
                  </div>
                )}
                <div>
                  <Label>Best time to reach you</Label>
                  <Select value={form.contactTime} onValueChange={(v) => set("contactTime", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Any concerns or questions? (optional)</Label>
                  <Textarea className="mt-1" rows={2} placeholder="Anything you want our team to know..." value={form.concerns} onChange={(e) => set("concerns", e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button onClick={handleSubmitApplication} disabled={loading} className="flex-1 gap-2">
                    {loading ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : <>Next: Documents <ChevronRight size={14} /></>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DOCUMENT UPLOAD STEP */}
        {mode === "documents" && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={18} className="text-primary" />
              <h2 className="font-serif text-lg font-bold">Upload Your Documents</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              These documents will be reviewed by our team before we submit your application.
            </p>

            {/* Progress indicator */}
            <div className="flex items-center gap-2 mb-5 p-3 bg-muted/40 rounded-xl">
              <Upload size={14} className="text-primary flex-shrink-0" />
              <span className="text-xs text-muted-foreground flex-1">
                {requiredUploaded} of {totalRequired} required documents uploaded
              </span>
              <Badge className={`text-xs ${canFinish ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground border-border"} border`}>
                {canFinish ? "✓ Ready" : `${totalRequired - requiredUploaded} missing`}
              </Badge>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm mb-4">{error}</div>}

            <div className="space-y-3 mb-6">
              {/* Required documents first */}
              {documents.filter((d) => d.required).map((slot, i) => {
                const realIdx = documents.findIndex((d) => d.type === slot.type && d.required === slot.required);
                return (
                  <DocumentUploader
                    key={`req-${i}`}
                    slot={slot}
                    onUploaded={(path, name, size) => handleDocumentUploaded(realIdx, path, name, size)}
                    onRemove={() => handleDocumentRemoved(realIdx)}
                  />
                );
              })}

              {/* Optional separator */}
              {documents.some((d) => !d.required) && (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">Optional</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              {documents.filter((d) => !d.required).map((slot, i) => {
                const realIdx = documents.findIndex((d) => d.type === slot.type && !d.required);
                return (
                  <DocumentUploader
                    key={`opt-${i}`}
                    slot={slot}
                    onUploaded={(path, name, size) => handleDocumentUploaded(realIdx, path, name, size)}
                    onRemove={() => handleDocumentRemoved(realIdx)}
                  />
                );
              })}
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => handleSaveDocuments(true)}
                disabled={!canFinish || savingDocs}
                className="w-full gap-2"
              >
                {savingDocs
                  ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                  : <><CheckCircle2 size={14} /> Submit Application</>
                }
              </Button>
              {anyUploaded && !canFinish && (
                <Button
                  variant="outline"
                  onClick={() => handleSaveDocuments(false)}
                  disabled={savingDocs}
                  className="w-full text-sm gap-2"
                >
                  Save Progress & Continue Later
                </Button>
              )}
              {!anyUploaded && (
                <button
                  onClick={() => setMode("success")}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Skip for now — I'll upload documents later
                </button>
              )}
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {mode === "success" && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="font-serif text-xl font-bold mb-2">Application Received!</h2>
            <p className="text-muted-foreground text-sm mb-6">Our team will review your profile and documents within 24–48 hours.</p>

            <div className="bg-muted rounded-xl p-4 text-left mb-6 space-y-2">
              {[
                "We review your profile & documents within 24–48h",
                "We contact you to confirm any missing items",
                "We prepare and submit your application",
                "You get updates at every stage",
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button asChild className="flex-1"><Link href="/dashboard" onClick={onClose}>My Applications</Link></Button>
              <Button variant="outline" onClick={onClose} className="flex-1">Keep Browsing</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
