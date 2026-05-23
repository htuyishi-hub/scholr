import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useStudent, updateStudentProfile } from "@/hooks/use-student-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, User, GraduationCap, Globe, Languages } from "lucide-react";

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Bangladesh","Belgium","Brazil","Cambodia","Cameroon","Canada","Chile","China","Colombia","Congo","Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Japan","Jordan","Kenya","Korea","Lebanon","Malaysia","Mexico","Morocco","Nepal","Netherlands","New Zealand","Nigeria","Norway","Pakistan","Peru","Philippines","Poland","Portugal","Romania","Russia","Rwanda","Saudi Arabia","Senegal","South Africa","Spain","Sri Lanka","Sweden","Switzerland","Tanzania","Thailand","Turkey","Uganda","Ukraine","United Kingdom","United States","Venezuela","Vietnam","Zimbabwe","Other"];
const STUDY_LEVELS = ["Undergraduate", "Masters", "PhD", "Short Course", "Any"];
const DEST_COUNTRIES = ["USA", "UK", "Canada", "Australia", "Germany", "France", "Netherlands", "Sweden", "Norway", "Japan", "China", "UAE", "Any"];

export function StudentProfile() {
  const [, setLocation] = useLocation();
  const { student, setStudent, loading } = useStudent();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    nationality: "",
    residence: "",
    dateOfBirth: "",
    educationLevel: "",
    gpa: "",
    fieldOfStudy: "",
    graduationYear: "",
    targetLevel: [] as string[],
    targetCountry: [] as string[],
    targetField: "",
    studyTimeline: "",
    englishLevel: "",
    ieltsScore: "",
    toeflScore: "",
    passportCountry: "",
    hasVisa: false,
    whatsappNumber: "",
  });

  useEffect(() => {
    if (!loading && !student) {
      setLocation("/login");
    }
    if (student) {
      setForm({
        name: student.name || "",
        nationality: student.nationality || "",
        residence: student.residence || "",
        dateOfBirth: student.dateOfBirth || "",
        educationLevel: student.educationLevel || "",
        gpa: student.gpa || "",
        fieldOfStudy: student.fieldOfStudy || "",
        graduationYear: student.graduationYear?.toString() || "",
        targetLevel: student.targetLevel || [],
        targetCountry: student.targetCountry || [],
        targetField: student.targetField || "",
        studyTimeline: student.studyTimeline || "",
        englishLevel: student.englishLevel || "",
        ieltsScore: student.ieltsScore || "",
        toeflScore: student.toeflScore?.toString() || "",
        passportCountry: student.passportCountry || "",
        hasVisa: student.hasVisa || false,
        whatsappNumber: student.whatsappNumber || "",
      });
    }
  }, [student, loading, setLocation]);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const toggleArr = (k: "targetLevel" | "targetCountry", val: string) => {
    setForm((f) => ({ ...f, [k]: f[k].includes(val) ? f[k].filter((x) => x !== val) : [...f[k], val] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateStudentProfile({
        name: form.name,
        nationality: form.nationality || undefined,
        residence: form.residence || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        educationLevel: form.educationLevel || undefined,
        gpa: form.gpa || undefined,
        fieldOfStudy: form.fieldOfStudy || undefined,
        graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined,
        targetLevel: form.targetLevel.length ? form.targetLevel : undefined,
        targetCountry: form.targetCountry.length ? form.targetCountry : undefined,
        targetField: form.targetField || undefined,
        studyTimeline: form.studyTimeline || undefined,
        englishLevel: form.englishLevel || undefined,
        ieltsScore: form.ieltsScore || undefined,
        toeflScore: form.toeflScore ? parseInt(form.toeflScore) : undefined,
        passportCountry: form.passportCountry || undefined,
        hasVisa: form.hasVisa,
        whatsappNumber: form.whatsappNumber || undefined,
      } as any);
      setStudent(updated);
      toast({ title: "Profile saved!", description: "Your profile has been updated." });
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-12 space-y-4 max-w-2xl">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
  if (!student) return null;

  const profileFields = [student.nationality, student.educationLevel, student.gpa, student.targetLevel?.length, student.targetCountry?.length];
  const profilePct = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Link href="/dashboard"><ArrowLeft size={16} /> Dashboard</Link>
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">Edit Profile</h1>
        <div className="flex items-center gap-2">
          <div className="w-16 bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: `${profilePct}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{profilePct}%</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <section className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-primary" />
            <h2 className="font-semibold">Basic Information</h2>
          </div>
          <div className="space-y-4">
            <div><Label>Full Name</Label><Input className="mt-1" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div><Label>WhatsApp Number</Label><Input className="mt-1" placeholder="+1234567890" value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nationality</Label>
                <Select onValueChange={(v) => set("nationality", v)} value={form.nationality}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Country" /></SelectTrigger>
                  <SelectContent className="max-h-60">{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Residence</Label>
                <Select onValueChange={(v) => set("residence", v)} value={form.residence}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Country" /></SelectTrigger>
                  <SelectContent className="max-h-60">{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Date of Birth</Label><Input className="mt-1" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} /></div>
          </div>
        </section>

        {/* Education */}
        <section className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={18} className="text-primary" />
            <h2 className="font-semibold">Education</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Highest Education Completed</Label>
              <Select onValueChange={(v) => set("educationLevel", v)} value={form.educationLevel}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>{["High School", "Bachelor's", "Master's", "PhD"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Field of Study</Label><Input className="mt-1" placeholder="e.g. Computer Science" value={form.fieldOfStudy} onChange={(e) => set("fieldOfStudy", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>GPA</Label>
                <Select onValueChange={(v) => set("gpa", v)} value={form.gpa}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="GPA" /></SelectTrigger>
                  <SelectContent>{[["4.0","4.0+"],["3.7","3.7"],["3.5","3.5"],["3.0","3.0"],["2.5","2.5"],["2.0","2.0"]].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Graduation Year</Label><Input className="mt-1" type="number" placeholder="2025" value={form.graduationYear} onChange={(e) => set("graduationYear", e.target.value)} /></div>
            </div>
          </div>
        </section>

        {/* Goals */}
        <section className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h2 className="font-semibold">Goals</h2>
          </div>
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Desired Study Level</Label>
              <div className="flex flex-wrap gap-2">
                {STUDY_LEVELS.map((l) => (
                  <Badge key={l} variant={form.targetLevel.includes(l) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleArr("targetLevel", l)}>{l}</Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Preferred Destinations</Label>
              <div className="flex flex-wrap gap-2">
                {DEST_COUNTRIES.map((c) => (
                  <Badge key={c} variant={form.targetCountry.includes(c) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleArr("targetCountry", c)}>{c}</Badge>
                ))}
              </div>
            </div>
            <div><Label>Field of Interest</Label><Input className="mt-1" placeholder="e.g. Data Science" value={form.targetField} onChange={(e) => set("targetField", e.target.value)} /></div>
            <div>
              <Label>Study Timeline</Label>
              <Select onValueChange={(v) => set("studyTimeline", v)} value={form.studyTimeline}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="When to start?" /></SelectTrigger>
                <SelectContent>{["2025","2026","2027","Not sure yet"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Languages size={18} className="text-primary" />
            <h2 className="font-semibold">Language & Documents</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label>English Proficiency</Label>
              <Select onValueChange={(v) => set("englishLevel", v)} value={form.englishLevel}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{["Native Speaker","IELTS","TOEFL","Not yet tested"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.englishLevel === "IELTS" && (
              <div><Label>IELTS Score</Label><Input className="mt-1" type="number" step="0.5" min="0" max="9" value={form.ieltsScore} onChange={(e) => set("ieltsScore", e.target.value)} /></div>
            )}
            {form.englishLevel === "TOEFL" && (
              <div><Label>TOEFL Score</Label><Input className="mt-1" type="number" min="0" max="120" value={form.toeflScore} onChange={(e) => set("toeflScore", e.target.value)} /></div>
            )}
            <div>
              <Label>Passport Country</Label>
              <Select onValueChange={(v) => set("passportCountry", v)} value={form.passportCountry}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent className="max-h-60">{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="hasVisa" checked={form.hasVisa} onChange={(e) => set("hasVisa", e.target.checked)} className="w-4 h-4" />
              <Label htmlFor="hasVisa">I have an active student visa</Label>
            </div>
          </div>
        </section>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2 py-6 text-base">
          {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Profile</>}
        </Button>
      </div>
    </div>
  );
}
