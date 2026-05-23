import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { studentRegister } from "@/hooks/use-student-auth";
import { useStudent } from "@/hooks/use-student-auth";
import { Loader2, CheckCircle2, ChevronRight, GraduationCap } from "lucide-react";

const STEPS = ["Account", "Background", "Education", "Goals", "Language"];
const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Bangladesh","Belgium","Bolivia","Brazil","Cambodia","Cameroon","Canada","Chile","China","Colombia","Congo","Cuba","Denmark","Ecuador","Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece","Guatemala","Haiti","Honduras","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Korea","Kuwait","Lebanon","Libya","Malaysia","Mexico","Morocco","Mozambique","Myanmar","Nepal","Netherlands","New Zealand","Nicaragua","Nigeria","Norway","Pakistan","Palestine","Peru","Philippines","Poland","Portugal","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Sierra Leone","Somalia","South Africa","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe","Other"];
const STUDY_LEVELS = ["Undergraduate", "Masters", "PhD", "Short Course", "Any"];
const DEST_COUNTRIES = ["USA", "UK", "Canada", "Australia", "Germany", "France", "Netherlands", "Sweden", "Norway", "Japan", "China", "UAE", "Any"];

export function StudentRegister() {
  const [, setLocation] = useLocation();
  const { setStudent } = useStudent();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    nationality: "", residence: "", dateOfBirth: "",
    educationLevel: "", gpa: "", fieldOfStudy: "", graduationYear: "",
    targetLevel: [] as string[], targetCountry: [] as string[], targetField: "", studyTimeline: "",
    englishLevel: "", ieltsScore: "", toeflScore: "", passportCountry: "", hasVisa: false,
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const toggleArr = (k: "targetLevel" | "targetCountry", val: string) => {
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(val) ? f[k].filter((x) => x !== val) : [...f[k], val],
    }));
  };

  const next = () => {
    setError("");
    if (step === 0) {
      if (!form.name || !form.email || !form.password) { setError("Please fill all required fields"); return; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
      if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const student = await studentRegister(form.name, form.email, form.password);
      setStudent(student);
      // Update profile with collected info
      const { updateStudentProfile } = await import("@/hooks/use-student-auth");
      const profileData: Record<string, unknown> = {};
      if (form.nationality) profileData.nationality = form.nationality;
      if (form.residence) profileData.residence = form.residence;
      if (form.dateOfBirth) profileData.dateOfBirth = form.dateOfBirth;
      if (form.educationLevel) profileData.educationLevel = form.educationLevel;
      if (form.gpa) profileData.gpa = form.gpa;
      if (form.fieldOfStudy) profileData.fieldOfStudy = form.fieldOfStudy;
      if (form.graduationYear) profileData.graduationYear = parseInt(form.graduationYear);
      if (form.targetLevel.length) profileData.targetLevel = form.targetLevel;
      if (form.targetCountry.length) profileData.targetCountry = form.targetCountry;
      if (form.targetField) profileData.targetField = form.targetField;
      if (form.studyTimeline) profileData.studyTimeline = form.studyTimeline;
      if (form.englishLevel) profileData.englishLevel = form.englishLevel;
      if (form.ieltsScore) profileData.ieltsScore = form.ieltsScore;
      if (form.toeflScore) profileData.toeflScore = parseInt(form.toeflScore);
      if (form.passportCountry) profileData.passportCountry = form.passportCountry;
      profileData.hasVisa = form.hasVisa;
      if (Object.keys(profileData).length > 0) {
        const updated = await updateStudentProfile(profileData as any);
        setStudent(updated);
      }
      setLocation("/dashboard");
    } catch (e: unknown) {
      setError((e as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-2xl mx-auto mb-4">
            S
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">Find and apply to scholarships tailored for you</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : "bg-muted text-muted-foreground"}`}>
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="font-serif text-xl font-bold mb-6">Step {step + 1}: {STEPS[step]}</h2>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm mb-4">{error}</div>}

          {step === 0 && (
            <div className="space-y-4">
              <div><Label>Full Name *</Label><Input className="mt-1" placeholder="John Doe" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div><Label>Email Address *</Label><Input className="mt-1" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div><Label>Password *</Label><Input className="mt-1" type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => set("password", e.target.value)} /></div>
              <div><Label>Confirm Password *</Label><Input className="mt-1" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} /></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Nationality</Label>
                <Select onValueChange={(v) => set("nationality", v)} value={form.nationality}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent className="max-h-60">{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Current Country of Residence</Label>
                <Select onValueChange={(v) => set("residence", v)} value={form.residence}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent className="max-h-60">{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date of Birth</Label><Input className="mt-1" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} /></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Highest Education Completed</Label>
                <Select onValueChange={(v) => set("educationLevel", v)} value={form.educationLevel}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {["High School", "Bachelor's", "Master's", "PhD"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Field of Study / Major</Label><Input className="mt-1" placeholder="e.g. Computer Science" value={form.fieldOfStudy} onChange={(e) => set("fieldOfStudy", e.target.value)} /></div>
              <div>
                <Label>Current GPA</Label>
                <Select onValueChange={(v) => set("gpa", v)} value={form.gpa}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select GPA" /></SelectTrigger>
                  <SelectContent>
                    {[["4.0", "4.0 (First Class / 90%+"], ["3.7", "3.7 (A- / 85%+)"], ["3.5", "3.5 (Merit / 80%+)"], ["3.0", "3.0 (2:1 / 70%+)"], ["2.5", "2.5 (2:2 / 60%+)"], ["2.0", "2.0 (Pass / 50%+)"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Expected Graduation Year (if still enrolled)</Label><Input className="mt-1" type="number" placeholder="e.g. 2025" value={form.graduationYear} onChange={(e) => set("graduationYear", e.target.value)} /></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Desired Study Level (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {STUDY_LEVELS.map((l) => (
                    <Badge
                      key={l}
                      variant={form.targetLevel.includes(l) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArr("targetLevel", l)}
                    >{l}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Preferred Destination Countries</Label>
                <div className="flex flex-wrap gap-2">
                  {DEST_COUNTRIES.map((c) => (
                    <Badge
                      key={c}
                      variant={form.targetCountry.includes(c) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArr("targetCountry", c)}
                    >{c}</Badge>
                  ))}
                </div>
              </div>
              <div><Label>Field of Interest for Next Program</Label><Input className="mt-1" placeholder="e.g. Data Science" value={form.targetField} onChange={(e) => set("targetField", e.target.value)} /></div>
              <div>
                <Label>Study Timeline</Label>
                <Select onValueChange={(v) => set("studyTimeline", v)} value={form.studyTimeline}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="When do you want to start?" /></SelectTrigger>
                  <SelectContent>
                    {["2025", "2026", "2027", "Not sure yet"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label>English Proficiency</Label>
                <Select onValueChange={(v) => set("englishLevel", v)} value={form.englishLevel}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select proficiency" /></SelectTrigger>
                  <SelectContent>
                    {["Native Speaker", "IELTS", "TOEFL", "Not yet tested"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.englishLevel === "IELTS" && (
                <div><Label>IELTS Score (e.g. 7.0)</Label><Input className="mt-1" type="number" step="0.5" min="0" max="9" value={form.ieltsScore} onChange={(e) => set("ieltsScore", e.target.value)} /></div>
              )}
              {form.englishLevel === "TOEFL" && (
                <div><Label>TOEFL Score</Label><Input className="mt-1" type="number" min="0" max="120" value={form.toeflScore} onChange={(e) => set("toeflScore", e.target.value)} /></div>
              )}
              <div>
                <Label>Passport Country</Label>
                <Select onValueChange={(v) => set("passportCountry", v)} value={form.passportCountry}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent className="max-h-60">{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="hasVisa" checked={form.hasVisa} onChange={(e) => set("hasVisa", e.target.checked)} className="w-4 h-4" />
                <Label htmlFor="hasVisa">I currently have an active student visa</Label>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">Back</Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={next} className="flex-1 gap-2">Continue <ChevronRight size={16} /></Button>
            ) : (
              <Button onClick={handleSubmit} className="flex-1 gap-2" disabled={loading}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : <><GraduationCap size={16} /> Create Account</>}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
