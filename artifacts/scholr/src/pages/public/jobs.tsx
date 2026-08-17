import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Briefcase, MapPin, Clock, Search, Plus, ExternalLink, Building2,
  Filter, ChevronRight, Loader2
} from "lucide-react";
import { JobSubmitModal } from "@/components/job-submit-modal";

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
  featured: boolean;
  createdAt: string;
  sourceName?: string | null;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Remote", "Volunteer"];
const CATEGORIES = ["Technology", "Health", "Education", "Finance", "NGO", "Government", "Engineering", "Legal", "Marketing", "Agriculture", "Other"];

async function fetchJobs(params: Record<string, string>): Promise<Job[]> {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/api/jobs?${q}`);
  if (!res.ok) return [];
  return res.json();
}

function JobCard({ job }: { job: Job }) {
  const daysUntil = job.deadline
    ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000)
    : null;
  const isUrgent = daysUntil !== null && daysUntil <= 7 && daysUntil > 0;
  const isExpired = daysUntil !== null && daysUntil <= 0;

  return (
    <div className={`group bg-card border rounded-2xl p-5 hover:shadow-lg hover:border-primary/30 transition-all flex flex-col gap-3 ${job.featured ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}>
      {job.featured && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">⭐ Featured</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
          <Building2 size={20} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-snug truncate group-hover:text-primary transition-colors">{job.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{job.organization}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {job.location && (
          <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
        )}
        {job.jobType && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{job.jobType}</Badge>
        )}
        {job.category && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{job.category}</Badge>
        )}
      </div>

      {job.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{job.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {job.deadline && !isExpired && (
            <span className={`flex items-center gap-1 ${isUrgent ? "text-orange-500 font-medium" : ""}`}>
              <Clock size={11} />
              {isUrgent ? `${daysUntil}d left` : new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          {isExpired && <span className="text-red-400 text-xs">Expired</span>}
          {job.salary && <span>· {job.salary}</span>}
        </div>
        {job.applicationLink && (
          <a href={job.applicationLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-1.5 h-8 text-xs">Apply <ExternalLink size={11} /></Button>
          </a>
        )}
      </div>
    </div>
  );
}

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [showSubmit, setShowSubmit] = useState(false);

  const load = async (params: Record<string, string> = {}) => {
    setLoading(true);
    const data = await fetchJobs(params);
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (category !== "all") params.category = category;
    if (jobType !== "all") params.jobType = jobType;
    load(params);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-2">Jobs & Opportunities</h1>
          <p className="text-muted-foreground">Find jobs, internships, and career opportunities in Rwanda and beyond.</p>
        </div>
        <Button onClick={() => setShowSubmit(true)} className="gap-2 flex-shrink-0">
          <Plus size={16} /> Post a Job
        </Button>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search jobs, organizations..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={jobType} onValueChange={setJobType}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Job Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary" className="gap-2">
          <Filter size={14} /> Filter
        </Button>
      </form>

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="font-semibold text-lg mb-2">No jobs found</h2>
          <p className="text-muted-foreground text-sm mb-6">Try different filters or be the first to post a job.</p>
          <Button onClick={() => setShowSubmit(true)} className="gap-2"><Plus size={14} /> Post a Job</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {showSubmit && <JobSubmitModal onClose={() => setShowSubmit(false)} />}
    </div>
  );
}
