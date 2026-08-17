import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  Save, ArrowLeft, Upload, X, Loader2, Eye, EyeOff,
  Star, Pin, ExternalLink, MessageCircle, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateOpportunity,
  useUpdateOpportunity,
  useGetOpportunity,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Scholarships", "Fellowships", "Grants", "Internships", "Conferences", "Competitions"];
const STUDY_LEVELS = ["undergraduate", "masters", "phd", "postdoc", "any"];
const FUNDING_TYPES = ["full", "partial", "free"];
const SMART_TAGS = ["Fast Response", "Open to All", "Women Only", "Highly Competitive", "No Essay Required", "STEM", "Africa Focus", "No Interview Required"];
const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);
}

interface FormData {
  title: string;
  slug: string;
  description: string;
  content: string;
  coverImage: string;
  category: string;
  country: string;
  fundingType: string;
  studyLevel: string[];
  deadline: string;
  amount: string;
  applyLink: string;
  whatsappNumber: string;
  tags: string;
  smartTags: string[];
  status: "published" | "draft" | "archived";
  featured: boolean;
  pinned: boolean;
  // Eligibility
  minGpa: string;
  minEnglishIelts: string;
  genderRestriction: string;
  // Enrichment
  hostOrganization: string;
  hostWebsite: string;
  scholarshipType: string;
  renewable: boolean;
  numberOfAwards: string;
  applicationFee: string;
  interviewRequired: boolean;
  essayRequired: boolean;
  referenceLetters: string;
  notificationDate: string;
  programDuration: string;
  requiredDocuments: string[];
}

const INITIAL_FORM: FormData = {
  title: "",
  slug: "",
  description: "",
  content: "",
  coverImage: "",
  category: "Scholarships",
  country: "",
  fundingType: "full",
  studyLevel: ["masters"],
  deadline: "",
  amount: "",
  applyLink: "",
  whatsappNumber: "",
  tags: "",
  smartTags: [],
  status: "draft",
  featured: false,
  pinned: false,
  minGpa: "",
  minEnglishIelts: "",
  genderRestriction: "",
  hostOrganization: "",
  hostWebsite: "",
  scholarshipType: "",
  renewable: false,
  numberOfAwards: "",
  applicationFee: "",
  interviewRequired: false,
  essayRequired: false,
  referenceLetters: "",
  notificationDate: "",
  programDuration: "",
  requiredDocuments: [],
};

export function PostsForm({ id }: { id?: string }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEdit = !!id;

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [slugEdited, setSlugEdited] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAiGenerate = async () => {
    if (!form.title) { toast({ title: "Add a title first", variant: "destructive" }); return; }
    setAiGenerating(true);
    try {
      const token = localStorage.getItem("scholr_token");
      const res = await fetch(`${BASE_URL}/api/ai/generate-description`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          country: form.country,
          category: form.category,
          fundingType: form.fundingType,
          studyLevel: form.studyLevel,
          amount: form.amount,
          deadline: form.deadline,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "AI generation failed");
      }
      const data = await res.json() as { description: string; content: string };
      if (data.description) setField("description", data.description);
      if (data.content) setField("content", data.content);
      toast({ title: "AI content generated!", description: "Review and edit before publishing." });
    } catch (e: unknown) {
      toast({ title: "AI Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const toggleSmartTag = (tag: string) => {
    setForm(f => ({
      ...f,
      smartTags: f.smartTags.includes(tag) ? f.smartTags.filter(t => t !== tag) : [...f.smartTags, tag],
    }));
  };

  const { data: existing, isLoading: existingLoading } = useGetOpportunity(id!, {
    query: { enabled: isEdit } as any,
  });
  const createOpp = useCreateOpportunity();
  const updateOpp = useUpdateOpportunity();

  useEffect(() => {
    if (existing) {
      const e = existing;
      setForm({
        title: existing.title || "",
        slug: existing.slug || "",
        description: existing.description || "",
        content: existing.content || "",
        coverImage: existing.coverImage || "",
        category: (existing.category || "Scholarships") as string,
        country: existing.country || "",
        fundingType: (existing.fundingType || "full") as string,
        studyLevel: existing.studyLevel || ["masters"],
        deadline: existing.deadline ? existing.deadline.slice(0, 10) : "",
        amount: existing.amount || "",
        applyLink: existing.applyLink || "",
        whatsappNumber: existing.whatsappNumber || "",
        tags: (existing.tags || []).filter((t): t is string => typeof t === "string" && !["Fast Response","Open to All","Women Only","Highly Competitive","No Essay Required","STEM","Africa Focus","No Interview Required"].includes(t)).join(", "),
        smartTags: (existing.tags || []).filter((t): t is string => ["Fast Response","Open to All","Women Only","Highly Competitive","No Essay Required","STEM","Africa Focus","No Interview Required"].includes(t as string)),
        status: (existing.status || "draft") as any,
        featured: existing.featured || false,
        pinned: existing.pinned || false,
        minGpa: String((e as any).minGpa || ""),
        minEnglishIelts: String((e as any).minEnglishIelts || ""),
        genderRestriction: String((e as any).genderRestriction || ""),
        hostOrganization: String((e as any).hostOrganization || ""),
        hostWebsite: String((e as any).hostWebsite || ""),
        scholarshipType: String((e as any).scholarshipType || ""),
        renewable: Boolean((e as any).renewable),
        numberOfAwards: String((e as any).numberOfAwards || ""),
        applicationFee: String((e as any).applicationFee || ""),
        interviewRequired: Boolean((e as any).interviewRequired),
        essayRequired: Boolean((e as any).essayRequired),
        referenceLetters: String((e as any).referenceLetters || ""),
        notificationDate: (e as any).notificationDate ? String((e as any).notificationDate).slice(0, 10) : "",
        programDuration: String((e as any).programDuration || ""),
        requiredDocuments: Array.isArray((e as any).requiredDocuments) ? ((e as any).requiredDocuments as string[]) : [],
      });
      setSlugEdited(true);
    }
  }, [existing]);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleTitleChange = (title: string) => {
    setField("title", title);
    if (!slugEdited) {
      setField("slug", generateSlug(title));
    }
  };

  const handleStudyLevelToggle = (level: string) => {
    setForm(f => ({
      ...f,
      studyLevel: f.studyLevel.includes(level)
        ? f.studyLevel.filter(l => l !== level)
        : [...f.studyLevel, level],
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("scholr_token");
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const result = await res.json();
      if (result?.url) {
        setField("coverImage", result.url);
        toast({ title: "Image uploaded successfully" });
      } else {
        throw new Error(result?.error || "Upload failed");
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Failed to upload image.", variant: "destructive" });
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = (publish: boolean) => {
    const tags = form.tags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const allTags = [...tags, ...form.smartTags].filter(Boolean);

    const payload = {
      title: form.title,
      slug: form.slug,
      description: form.description || undefined,
      content: form.content || undefined,
      coverImage: form.coverImage || undefined,
      category: form.category || undefined,
      country: form.country || undefined,
      fundingType: (form.fundingType as "full" | "partial" | "free") || undefined,
      studyLevel: form.studyLevel.length ? form.studyLevel : undefined,
      deadline: form.deadline || undefined,
      amount: form.amount || undefined,
      applyLink: form.applyLink || undefined,
      whatsappNumber: form.whatsappNumber || undefined,
      tags: allTags.length ? allTags : undefined,
      status: (publish ? "published" : form.status) as "published" | "draft" | "archived",
      featured: form.featured,
      pinned: form.pinned,
    };

    // Advanced fields — only include when set
    if (form.hostOrganization) (payload as any).hostOrganization = form.hostOrganization;
    if (form.minGpa) (payload as any).minGpa = form.minGpa;
    if (form.minEnglishIelts) (payload as any).minEnglishIelts = form.minEnglishIelts;
    if (form.genderRestriction) (payload as any).genderRestriction = form.genderRestriction;
    if (form.numberOfAwards) (payload as any).numberOfAwards = parseInt(form.numberOfAwards, 10);
    if (form.applicationFee) (payload as any).applicationFee = form.applicationFee;
    if (form.programDuration) (payload as any).programDuration = form.programDuration;
    if (form.notificationDate) (payload as any).notificationDate = form.notificationDate;
    if (form.referenceLetters) (payload as any).referenceLetters = parseInt(form.referenceLetters, 10);
    (payload as any).renewable = form.renewable;
    (payload as any).interviewRequired = form.interviewRequired;
    (payload as any).essayRequired = form.essayRequired;
    if (form.requiredDocuments.length > 0) (payload as any).requiredDocuments = form.requiredDocuments;

    if (isEdit && id) {
      updateOpp.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast({ title: publish ? "Published!" : "Saved!", description: `"${form.title}" has been ${publish ? "published" : "saved"}.` });
            setLocation("/admin/posts");
          },
          onError: (err: any) => {
            toast({ title: "Error", description: err?.response?.data?.error || "Failed to save.", variant: "destructive" });
          },
        }
      );
    } else {
      createOpp.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: publish ? "Published!" : "Draft saved", description: `"${form.title}" has been ${publish ? "published" : "saved as draft"}.` });
            setLocation("/admin/posts");
          },
          onError: (err: any) => {
            toast({ title: "Error", description: err?.response?.data?.error || "Failed to create.", variant: "destructive" });
          },
        }
      );
    }
  };

  const isSaving = createOpp.isPending || updateOpp.isPending;

  if (isEdit && existingLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm" className="rounded-xl gap-2" data-testid="button-back">
            <Link href="/admin/posts"><ArrowLeft size={16} /> Back</Link>
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-bold">{isEdit ? "Edit Post" : "New Post"}</h1>
            <p className="text-muted-foreground text-sm">{isEdit ? `Editing: ${existing?.title}` : "Create a new scholarship listing"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving || !form.title}
            className="rounded-xl gap-2"
            data-testid="button-save-draft"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving || !form.title}
            className="rounded-xl gap-2"
            data-testid="button-publish"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main */}
        <div className="xl:col-span-2 space-y-5">
          {/* Cover Image */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <Label className="text-base font-semibold">Cover Image</Label>
            {form.coverImage ? (
              <div className="relative rounded-xl overflow-hidden group">
                <img src={form.coverImage} alt="Cover" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <label className="cursor-pointer">
                    <Button variant="secondary" size="sm" className="rounded-xl gap-2 pointer-events-none">
                      <Upload size={14} /> Replace
                    </Button>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setField("coverImage", "")}>
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                {imageUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={24} className="animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="mx-auto mb-3 text-muted-foreground" />
                    <label className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:underline">Upload image</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" data-testid="input-cover-image" />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">or paste a URL below</p>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={form.coverImage}
                      onChange={e => setField("coverImage", e.target.value)}
                      className="mt-3 rounded-xl text-sm"
                      data-testid="input-cover-image-url"
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Title & Slug */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Gates Cambridge Scholarship 2026"
                value={form.title}
                onChange={e => handleTitleChange(e.target.value)}
                className="rounded-xl text-base font-medium"
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex-shrink-0">/opportunity/</span>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={e => { setSlugEdited(true); setField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }}
                  className="rounded-xl text-sm font-mono"
                  data-testid="input-slug"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Short Description</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || !form.title}
                  className="gap-1.5 text-xs h-7 text-primary hover:bg-primary/10"
                  data-testid="button-ai-generate"
                >
                  {aiGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {aiGenerating ? "Generating..." : "AI Generate"}
                </Button>
              </div>
              <Textarea
                id="description"
                placeholder="2–3 sentence summary for search results and cards..."
                value={form.description}
                onChange={e => setField("description", e.target.value)}
                rows={3}
                className="rounded-xl resize-none"
                data-testid="input-description"
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <Label className="text-base font-semibold">Full Content</Label>
            <p className="text-xs text-muted-foreground">Supports basic markdown: **bold**, - bullet lists, and paragraph breaks.</p>
            <Textarea
              placeholder="Full details, eligibility, benefits, how to apply..."
              value={form.content}
              onChange={e => setField("content", e.target.value)}
              rows={14}
              className="rounded-xl resize-none font-mono text-sm"
              data-testid="input-content"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status & Visibility */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <Label className="text-base font-semibold">Visibility</Label>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={v => setField("status", v as any)}>
                <SelectTrigger className="rounded-xl" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Star size={15} className="text-primary" />
                <span className="text-sm font-medium">Editor's Pick</span>
              </div>
              <Switch
                checked={form.featured}
                onCheckedChange={v => setField("featured", v)}
                data-testid="switch-featured"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pin size={15} className="text-blue-500" />
                <span className="text-sm font-medium">Pin to Top</span>
              </div>
              <Switch
                checked={form.pinned}
                onCheckedChange={v => setField("pinned", v)}
                data-testid="switch-pinned"
              />
            </div>
          </div>

          {/* Opportunity Details */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <Label className="text-base font-semibold">Details</Label>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={form.category} onValueChange={v => setField("category", v)}>
                <SelectTrigger className="rounded-xl" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Input
                placeholder="e.g. United Kingdom"
                value={form.country}
                onChange={e => setField("country", e.target.value)}
                className="rounded-xl"
                data-testid="input-country"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Funding Type</Label>
              <Select value={form.fundingType} onValueChange={v => setField("fundingType", v)}>
                <SelectTrigger className="rounded-xl" data-testid="select-funding-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Fully Funded</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="free">Free Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Study Level (select multiple)</Label>
              <div className="flex flex-wrap gap-2">
                {STUDY_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleStudyLevelToggle(level)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                      form.studyLevel.includes(level)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                    data-testid={`toggle-level-${level}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={e => setField("deadline", e.target.value)}
                className="rounded-xl"
                data-testid="input-deadline"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Award / Amount</Label>
              <Input
                placeholder="e.g. Full tuition + £21,000/year"
                value={form.amount}
                onChange={e => setField("amount", e.target.value)}
                className="rounded-xl"
                data-testid="input-amount"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink size={11} /> Apply Link
              </Label>
              <Input
                placeholder="https://..."
                value={form.applyLink}
                onChange={e => setField("applyLink", e.target.value)}
                className="rounded-xl"
                data-testid="input-apply-link"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <MessageCircle size={11} /> WhatsApp (override)
              </Label>
              <Input
                placeholder="+1234567890"
                value={form.whatsappNumber}
                onChange={e => setField("whatsappNumber", e.target.value)}
                className="rounded-xl"
                data-testid="input-whatsapp"
              />
            </div>
          </div>

          {/* Smart Tags */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <Label className="text-base font-semibold">Smart Tags</Label>
            <div className="flex flex-wrap gap-2">
              {SMART_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleSmartTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${form.smartTags.includes(tag) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Regular Tags */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <Label className="text-base font-semibold">Custom Tags</Label>
            <Input
              placeholder="cambridge, fully-funded, phd..."
              value={form.tags}
              onChange={e => setField("tags", e.target.value)}
              className="rounded-xl"
              data-testid="input-tags"
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of tags.</p>
          </div>

          {/* Advanced Details */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-colors"
              onClick={() => setShowAdvanced(v => !v)}
            >
              <Label className="text-base font-semibold cursor-pointer">Advanced Details</Label>
              {showAdvanced ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>

            {showAdvanced && (
              <div className="px-6 pb-6 space-y-4 border-t border-border pt-5">
                <p className="text-xs text-muted-foreground">Used for eligibility matching and student profiles</p>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Host Organization</Label>
                  <Input placeholder="e.g. Gates Cambridge Trust" value={form.hostOrganization} onChange={e => setField("hostOrganization", e.target.value)} className="rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Min GPA Required</Label>
                    <Input type="number" step="0.1" min="0" max="4" placeholder="e.g. 3.5" value={form.minGpa} onChange={e => setField("minGpa", e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Min IELTS Score</Label>
                    <Input type="number" step="0.5" min="0" max="9" placeholder="e.g. 6.5" value={form.minEnglishIelts} onChange={e => setField("minEnglishIelts", e.target.value)} className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Gender Restriction</Label>
                  <Select value={form.genderRestriction || "none"} onValueChange={v => setField("genderRestriction", v === "none" ? "" : v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="No restriction" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No restriction</SelectItem>
                      <SelectItem value="women">Women only</SelectItem>
                      <SelectItem value="men">Men only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Number of Awards</Label>
                    <Input type="number" min="1" placeholder="e.g. 50" value={form.numberOfAwards} onChange={e => setField("numberOfAwards", e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Application Fee (USD)</Label>
                    <Input placeholder="0 = free" value={form.applicationFee} onChange={e => setField("applicationFee", e.target.value)} className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Program Duration</Label>
                  <Input placeholder="e.g. 12 months, 4 years" value={form.programDuration} onChange={e => setField("programDuration", e.target.value)} className="rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Notification Date</Label>
                  <Input type="date" value={form.notificationDate} onChange={e => setField("notificationDate", e.target.value)} className="rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Reference Letters Required</Label>
                  <Input type="number" min="0" max="5" placeholder="e.g. 2" value={form.referenceLetters} onChange={e => setField("referenceLetters", e.target.value)} className="rounded-xl" />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Requirements</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "essayRequired", label: "Essay Required" },
                      { key: "interviewRequired", label: "Interview Required" },
                      { key: "renewable", label: "Renewable" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={key}
                          checked={form[key as keyof FormData] as boolean}
                          onChange={e => setField(key as keyof FormData, e.target.checked as any)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={key} className="text-sm">{label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Required Documents (for Apply With Us)</Label>
                  <p className="text-xs text-muted-foreground">Select which documents students must upload when applying through Scholr. Leave empty to use the default set.</p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[
                      { value: "cv", label: "CV / Resume" },
                      { value: "transcript", label: "Academic Transcript" },
                      { value: "passport", label: "Passport / National ID" },
                      { value: "photo", label: "Passport-size Photo" },
                      { value: "english_test", label: "English Test Score" },
                      { value: "recommendation", label: "Reference Letter" },
                      { value: "statement", label: "Personal Statement" },
                      { value: "certificate", label: "Certificate / Award" },
                    ].map(({ value, label }) => (
                      <div key={value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`doc-${value}`}
                          checked={form.requiredDocuments.includes(value)}
                          onChange={e => {
                            setField(
                              "requiredDocuments",
                              e.target.checked
                                ? [...form.requiredDocuments, value]
                                : form.requiredDocuments.filter(d => d !== value)
                            );
                          }}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`doc-${value}`} className="text-sm">{label}</label>
                      </div>
                    ))}
                  </div>
                  {form.requiredDocuments.length > 0 && (
                    <p className="text-xs text-primary mt-1">{form.requiredDocuments.length} document type{form.requiredDocuments.length > 1 ? "s" : ""} selected</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={() => handleSave(form.status === "published")}
            className="w-full rounded-xl gap-2 font-semibold"
            disabled={isSaving || !form.title}
            data-testid="button-save-bottom"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {form.status === "published" ? "Save & Publish" : "Save Draft"}
          </Button>
        </div>
      </div>
    </div>
  );
}
