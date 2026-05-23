import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useStudent, getMyApplications } from "@/hooks/use-student-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap, User, Search, Calendar, ChevronRight,
  CheckCircle2, Clock, FileText, Award, AlertCircle, Loader2
} from "lucide-react";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  opportunity: {
    id: string;
    title: string;
    slug: string;
    deadline: string | null;
    country: string | null;
    category: string | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending_review: { label: "Pending Review", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  profile_check: { label: "Profile Check", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: FileText },
  documents_collection: { label: "Documents Needed", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: FileText },
  in_progress: { label: "In Progress", color: "bg-primary/20 text-primary border-primary/30", icon: Loader2 },
  submitted: { label: "Submitted", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  accepted: { label: "Accepted!", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: Award },
  rejected: { label: "Not Successful", color: "bg-muted text-muted-foreground border-border", icon: AlertCircle },
};

const PIPELINE = ["pending_review", "profile_check", "documents_collection", "in_progress", "submitted"];

export function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { student, loading, logout } = useStudent();
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !student) {
      setLocation("/login");
    }
  }, [student, loading, setLocation]);

  useEffect(() => {
    if (student) {
      getMyApplications().then((apps) => {
        setApplications(apps);
        setAppsLoading(false);
      });
    }
  }, [student]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!student) return null;

  const profileFields = [
    student.nationality, student.educationLevel, student.gpa,
    student.targetLevel?.length, student.targetCountry?.length
  ];
  const profilePct = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-card border border-border rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-2xl">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">{student.name}</h1>
            <p className="text-muted-foreground text-sm">{student.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-muted rounded-full h-1.5 w-24">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${profilePct}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{profilePct}% profile complete</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/profile"><User size={14} /> Edit Profile</Link>
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href="/browse"><Search size={14} /> Browse</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
            Sign Out
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/browse" className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors group">
          <Search size={24} className="text-primary mb-3" />
          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Browse Opportunities</h3>
          <p className="text-sm text-muted-foreground">Find scholarships that match your profile</p>
        </Link>
        <Link href="/find-my-scholarship" className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors group">
          <GraduationCap size={24} className="text-primary mb-3" />
          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Find My Scholarship</h3>
          <p className="text-sm text-muted-foreground">Answer 6 questions, get matched results</p>
        </Link>
        <Link href="/profile" className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors group">
          <User size={24} className="text-primary mb-3" />
          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Complete Profile</h3>
          <p className="text-sm text-muted-foreground">Better profile = better matches + eligibility</p>
        </Link>
      </div>

      {/* Applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold">My Applications</h2>
          <Badge variant="secondary">{applications.length} total</Badge>
        </div>

        {appsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <GraduationCap size={40} className="text-muted-foreground mx-auto mb-3" />
            <h3 className="font-serif font-bold text-lg mb-2">No applications yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Browse opportunities and click "Apply With Us" to get guided support.</p>
            <Button asChild><Link href="/browse">Browse Opportunities</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending_review;
              const pipelineIdx = PIPELINE.indexOf(app.status);
              const Icon = cfg.icon;
              return (
                <div key={app.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold leading-tight">{app.opportunity?.title || "Unknown Opportunity"}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {app.opportunity?.country && <span>{app.opportunity.country}</span>}
                        {app.opportunity?.category && <><span>·</span><span>{app.opportunity.category}</span></>}
                        <span>·</span>
                        <span className="flex items-center gap-1"><Calendar size={11} />{new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                    <Badge className={`border text-xs whitespace-nowrap ${cfg.color}`}>
                      <Icon size={11} className="mr-1" />{cfg.label}
                    </Badge>
                  </div>

                  {/* Progress pipeline */}
                  {pipelineIdx >= 0 && (
                    <div className="flex items-center gap-1 mb-3">
                      {PIPELINE.map((s, i) => (
                        <div key={s} className={`flex-1 h-1 rounded-full ${i <= pipelineIdx ? "bg-primary" : "bg-muted"}`} />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {app.opportunity?.deadline && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar size={11} />Deadline: {new Date(app.opportunity.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                    {app.opportunity?.slug && (
                      <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                        <Link href={`/opportunity/${app.opportunity.slug}`}>View <ChevronRight size={12} /></Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
