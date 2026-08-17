import { useMemo } from "react";
import { Eye, FileText, Users, TrendingUp, Plus, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useGetDashboardSummary,
  useGetDashboardActivity,
  useListOpportunities,
} from "@workspace/api-client-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: number;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6" data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? "bg-[#10B981]/15 text-[#10B981]" : "bg-red-500/15 text-red-500"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold font-serif mb-1" data-testid={`stat-value-${title.toLowerCase().replace(/\s/g, "-")}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-sm text-muted-foreground">{title}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export function Dashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useGetDashboardSummary();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();
  const { data: recentPosts } = useListOpportunities({ limit: 5, sort: "latest" });

  // Build placeholder chart data
  const chartData = useMemo(() => {
    const days = 7;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        views: Math.floor(Math.random() * 200 + 50),
      };
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Platform overview and recent activity.</p>
        </div>
        <Button asChild className="rounded-xl gap-2 font-semibold" data-testid="button-new-post">
          <Link href="/admin/posts/new"><Plus size={16} /> New Post</Link>
        </Button>
      </div>

      {/* Stats Grid */}
      {analyticsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6">
              <Skeleton className="h-10 w-10 rounded-xl mb-4" />
              <Skeleton className="h-7 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Posts"
            value={analytics?.totalPosts ?? 0}
            sub="All statuses"
            icon={FileText}
            color="bg-blue-500/15 text-blue-500"
          />
          <StatCard
            title="Published"
            value={analytics?.publishedPosts ?? 0}
            sub="Live on site"
            icon={TrendingUp}
            color="bg-[#10B981]/15 text-[#10B981]"
          />
          <StatCard
            title="Total Views"
            value={analytics?.totalViews ?? 0}
            sub="Across all listings"
            icon={Eye}
            color="bg-primary/15 text-primary"
          />
          <StatCard
            title="Team Members"
            value={analytics?.teamMembers ?? 0}
            sub="Active editors"
            icon={Users}
            color="bg-purple-500/15 text-purple-500"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Views Chart */}
        <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-6" data-testid="chart-views">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-xl font-bold">Views (Last 7 Days)</h2>
              <p className="text-sm text-muted-foreground">Daily page views across all listings</p>
            </div>
          </div>
          {analyticsLoading ? (
            <Skeleton className="h-52" />
          ) : chartData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              No view data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="views" stroke="#F59E0B" strokeWidth={2} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-2xl p-6" data-testid="panel-recent-activity">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl font-bold">Recent Activity</h2>
          </div>
          {activityLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : !activity || activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-4">
              {activity.map((item: any) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">
                    {item.authorName?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      <span className="text-muted-foreground capitalize">{item.action}</span>{" "}
                      <span className="text-foreground">{item.opportunityTitle}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.authorName} · {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-card border border-border rounded-2xl p-6" data-testid="panel-recent-posts">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-bold">Recent Posts</h2>
          <Button asChild variant="ghost" size="sm" className="text-primary gap-1">
            <Link href="/admin/posts">View all <ArrowRight size={13} /></Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">Title</th>
                <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Country</th>
                <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Deadline</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
                <th className="pb-3 font-medium text-muted-foreground text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(recentPosts?.items || []).map((post) => (
                <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium line-clamp-1 max-w-xs">{post.title}</span>
                      <Link href={`/opportunity/${post.slug}`} target="_blank" className="text-muted-foreground hover:text-primary flex-shrink-0" data-testid={`link-view-${post.id}`}>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">{post.country || "—"}</td>
                  <td className="py-3 pr-4 text-muted-foreground hidden lg:table-cell">
                    {post.deadline ? new Date(post.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant="outline"
                      className={
                        post.status === "published"
                          ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                          : post.status === "draft"
                          ? "bg-muted text-muted-foreground"
                          : "bg-orange-500/15 text-orange-500 border-orange-500/30"
                      }
                    >
                      {post.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right text-muted-foreground">{post.views.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
