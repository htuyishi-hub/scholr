import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  Save, ArrowLeft, Upload, X, Loader2, Eye, EyeOff,
  Star, Pin, ExternalLink, MessageCircle,
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
  status: "published" | "draft" | "archived";
  featured: boolean;
  pinned: boolean;
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
  status: "draft",
  featured: false,
  pinned: false,
};

export function PostsForm({ id }: { id?: string }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEdit = !!id;

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [slugEdited, setSlugEdited] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  const { data: existing, isLoading: existingLoading } = useGetOpportunity(id!, {
    query: { enabled: isEdit } as any,
  });
  const createOpp = useCreateOpportunity();
  const updateOpp = useUpdateOpportunity();

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || "",
        slug: existing.slug || "",
        description: existing.description || "",
        content: existing.content || "",
        coverImage: existing.coverImage || "",
        category: existing.category || "Scholarships",
        country: existing.country || "",
        fundingType: existing.fundingType || "full",
        studyLevel: existing.studyLevel || ["masters"],
        deadline: existing.deadline ? existing.deadline.slice(0, 10) : "",
        amount: existing.amount || "",
        applyLink: existing.applyLink || "",
        whatsappNumber: existing.whatsappNumber || "",
        tags: (existing.tags || []).join(", "),
        status: (existing.status as any) || "draft",
        featured: existing.featured || false,
        pinned: existing.pinned || false,
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
      tags: tags.length ? tags : undefined,
      status: (publish ? "published" : form.status) as "published" | "draft" | "archived",
      featured: form.featured,
      pinned: form.pinned,
    };

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
              <Label htmlFor="description">Short Description</Label>
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

          {/* Tags */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <Label className="text-base font-semibold">Tags</Label>
            <Input
              placeholder="cambridge, fully-funded, phd..."
              value={form.tags}
              onChange={e => setField("tags", e.target.value)}
              className="rounded-xl"
              data-testid="input-tags"
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of tags.</p>
            {form.tags && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.tags.split(",").filter(Boolean).map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs capitalize">#{tag.trim()}</Badge>
                ))}
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
