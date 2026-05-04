import { useState } from "react";
import { Link } from "wouter";
import {
  Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Pin, Star,
  Loader2, FileText, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useListOpportunities,
  useDeleteOpportunity,
  useUpdateOpportunity,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  published: "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-orange-500/15 text-orange-500 border-orange-500/30",
};

export function Posts() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "published" | "draft" | "archived">("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useListOpportunities({
    q: q || undefined,
    status: (statusFilter as "published" | "draft" | "archived") || undefined,
    page,
    limit: 20,
    sort: "latest",
  });

  const deleteOpp = useDeleteOpportunity();
  const updateOpp = useUpdateOpportunity();

  const opportunities = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleSearch = () => {
    setQ(searchInput);
    setPage(1);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    deleteOpp.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Opportunity deleted", description: `"${title}" has been removed.` });
          refetch();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
        },
      }
    );
  };

  const handleToggleStatus = (id: string, current: string) => {
    const newStatus = current === "published" ? "draft" : "published";
    updateOpp.mutate(
      { id, data: { status: newStatus as "published" | "draft" | "archived" } },
      {
        onSuccess: () => {
          toast({ title: `Status updated`, description: `Post is now ${newStatus}.` });
          refetch();
        },
      }
    );
  };

  const handleToggleFeatured = (id: string, current: boolean) => {
    updateOpp.mutate(
      { id, data: { featured: !current } },
      {
        onSuccess: () => {
          toast({ title: !current ? "Added to Editor's Picks" : "Removed from Editor's Picks" });
          refetch();
        },
      }
    );
  };

  const handleTogglePinned = (id: string, current: boolean) => {
    updateOpp.mutate(
      { id, data: { pinned: !current } },
      {
        onSuccess: () => {
          toast({ title: !current ? "Post pinned" : "Post unpinned" });
          refetch();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Posts</h1>
          <p className="text-muted-foreground text-sm">{total > 0 ? `${total} opportunities` : "Manage all scholarship listings."}</p>
        </div>
        <Button asChild className="rounded-xl gap-2 font-semibold" data-testid="button-new-post">
          <Link href="/admin/posts/new"><Plus size={16} /> New Post</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search posts..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="pl-9 rounded-xl"
            data-testid="input-posts-search"
          />
        </div>
        <Button onClick={handleSearch} variant="outline" className="rounded-xl" data-testid="button-posts-search">Search</Button>
        <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v as any); setPage(1); }}>
          <SelectTrigger className="w-44 rounded-xl" data-testid="select-status-filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden" data-testid="posts-table">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="w-8 h-8" />
              </div>
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No posts found</p>
            <p className="text-sm mt-1">Create your first scholarship listing to get started.</p>
            <Button asChild className="rounded-xl mt-4 gap-2">
              <Link href="/admin/posts/new"><Plus size={14} /> Create First Post</Link>
            </Button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground hidden lg:table-cell">Country</th>
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground hidden md:table-cell">Deadline</th>
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-6 py-4 font-medium text-muted-foreground hidden sm:table-cell">Views</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-muted/20 transition-colors group" data-testid={`post-row-${opp.id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {opp.coverImage ? (
                          <img
                            src={opp.coverImage}
                            alt={opp.title}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 hidden sm:block"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 hidden sm:block">
                            <FileText size={16} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium line-clamp-1 flex items-center gap-2">
                            {opp.title}
                            {opp.featured && <Star size={12} className="text-primary flex-shrink-0" />}
                            {opp.pinned && <Pin size={12} className="text-blue-500 flex-shrink-0" />}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {opp.category} {opp.fundingType === "full" ? "· Fully Funded" : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground hidden lg:table-cell">{opp.country || "—"}</td>
                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">
                      {opp.deadline
                        ? new Date(opp.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`capitalize ${STATUS_COLORS[opp.status] || ""}`}>
                        {opp.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        <Eye size={13} />
                        {opp.views.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0" data-testid={`button-post-actions-${opp.id}`}>
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/posts/${opp.id}/edit`} data-testid={`button-edit-${opp.id}`}>
                              <Edit size={14} className="mr-2" /> Edit Post
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`/opportunity/${opp.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={14} className="mr-2" /> View on Site
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(opp.id, opp.status)}>
                            <Eye size={14} className="mr-2" />
                            {opp.status === "published" ? "Unpublish" : "Publish"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleFeatured(opp.id, opp.featured)}>
                            <Star size={14} className="mr-2" />
                            {opp.featured ? "Remove from Picks" : "Add to Editor's Picks"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePinned(opp.id, opp.pinned)}>
                            <Pin size={14} className="mr-2" />
                            {opp.pinned ? "Unpin" : "Pin Post"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(opp.id, opp.title)}
                            className="text-destructive focus:text-destructive"
                            data-testid={`button-delete-${opp.id}`}
                          >
                            <Trash2 size={14} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 p-4 border-t border-border">
                <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-xl">
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-xl">
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
