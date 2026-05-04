import { useState } from "react";
import { Plus, MoreHorizontal, Trash2, Edit, Loader2, UserCircle, Shield, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListUsers, useCreateUser, useDeleteUser, useGetMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type Role = "admin" | "editor";

export function Team() {
  const { toast } = useToast();
  const { data: users, isLoading, refetch } = useListUsers();
  const { data: me } = useGetMe();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "editor" as Role });
  const [formError, setFormError] = useState("");

  const handleInvite = () => {
    setFormError("");
    if (!form.name || !form.email || !form.password) {
      setFormError("All fields are required.");
      return;
    }

    createUser.mutate(
      { data: { name: form.name, email: form.email, password: form.password, role: form.role } },
      {
        onSuccess: () => {
          toast({ title: "Team member added", description: `${form.name} has been added to the team.` });
          setForm({ name: "", email: "", password: "", role: "editor" });
          setInviteOpen(false);
          refetch();
        },
        onError: (err: any) => {
          setFormError(err?.response?.data?.error || "Failed to create user.");
        },
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    deleteUser.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Team member removed", description: `${name} has been removed.` });
          refetch();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to remove team member.", variant: "destructive" });
        },
      }
    );
  };

  const roleIcon = (role: string) => {
    if (role === "admin") return <Shield size={12} />;
    return <Pen size={12} />;
  };

  const roleColor = (role: string) => {
    if (role === "admin") return "bg-primary/15 text-primary border-primary/30";
    return "bg-blue-500/15 text-blue-500 border-blue-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Team</h1>
          <p className="text-muted-foreground text-sm">Manage editors and administrators.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="rounded-xl gap-2 font-semibold" data-testid="button-invite-member">
          <Plus size={16} /> Add Member
        </Button>
      </div>

      {/* Team Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden" data-testid="team-table">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : !users || users.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <UserCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No team members yet</p>
            <p className="text-sm mt-1">Add your first team member to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-4 font-medium text-muted-foreground">Member</th>
                <th className="text-left px-6 py-4 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left px-6 py-4 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-6 py-4 font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors" data-testid={`team-row-${user.id}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0 overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        {user.id === me?.id && (
                          <div className="text-xs text-muted-foreground">You</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">{user.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`capitalize gap-1 ${roleColor(user.role)}`}>
                      {roleIcon(user.role)}
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground hidden lg:table-cell">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {user.id !== me?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0" data-testid={`button-member-actions-${user.id}`}>
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDelete(user.id, user.name)}
                            className="text-destructive focus:text-destructive"
                            data-testid={`button-delete-member-${user.id}`}
                          >
                            <Trash2 size={14} className="mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="rounded-2xl" data-testid="dialog-invite">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add Team Member</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="John Doe"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-xl"
                data-testid="input-member-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="rounded-xl"
                data-testid="input-member-email"
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Temporary password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="rounded-xl"
                data-testid="input-member-password"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as Role }))}>
                <SelectTrigger className="rounded-xl" data-testid="select-member-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor — Can create and edit posts</SelectItem>
                  <SelectItem value="admin">Admin — Full access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3" data-testid="text-invite-error">
                {formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleInvite} className="rounded-xl gap-2" disabled={createUser.isPending} data-testid="button-confirm-invite">
              {createUser.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
