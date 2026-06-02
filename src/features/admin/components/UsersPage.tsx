// src/app/[locale]/(admin)/admin/users/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  getAdminUsers, deactivateUser, softDeleteUser, restoreUser, impersonateUser,
} from "@/features/admin/services/admin-service";
import { startImpersonation } from "@/features/admin/utils/impersonation";
import type { AdminUser } from "@/features/admin/types";
import {
  Loader2, Search, MoreHorizontal, UserX, UserCheck, Trash2, ShieldAlert, LogIn,
} from "lucide-react";
import { toast } from "sonner";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch { return "—"; }
}

const roleStyles: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  SUPER_ADMIN: "bg-red-100 text-red-700 border-red-200",
  OWNER: "bg-blue-100 text-blue-700 border-blue-200",
};

type ConfirmAction = {
  type: "deactivate" | "delete" | "restore" | "impersonate";
  user: AdminUser;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers(page, limit);
      setUsers(res.items);
      setTotal(res.meta.total);
      setTotalPages(res.meta.pages);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === "deactivate") {
        await deactivateUser(confirm.user.id);
        toast.success("User deactivated");
        setConfirm(null);
        await fetchUsers();
      } else if (confirm.type === "delete") {
        await softDeleteUser(confirm.user.id);
        toast.success("User deleted");
        setConfirm(null);
        await fetchUsers();
      } else if (confirm.type === "restore") {
        await restoreUser(confirm.user.id);
        toast.success("User restored");
        setConfirm(null);
        await fetchUsers();
      } else if (confirm.type === "impersonate") {
        const res = await impersonateUser(confirm.user.id);
        startImpersonation(res.accessToken, {
          user: res.user,
          actor: res.actor,
        });
        toast.success(`Switching to ${res.user.name}...`);
        // Full page reload so auth context + middleware re-evaluate with the new token
        window.location.href = "/dashboard";
      }
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Dialog content helpers ───────────────────────────────────
  const dialogTitle = () => {
    switch (confirm?.type) {
      case "deactivate": return "Deactivate User";
      case "delete": return "Delete User";
      case "restore": return "Restore User";
      case "impersonate": return "Login as User";
      default: return "";
    }
  };

  const dialogDescription = () => {
    if (!confirm) return "";
    switch (confirm.type) {
      case "deactivate":
        return `Are you sure you want to deactivate "${confirm.user.name}"?`;
      case "delete":
        return `Are you sure you want to delete "${confirm.user.name}"? This action can be reversed.`;
      case "restore":
        return `Restore "${confirm.user.name}" and reactivate their account?`;
      case "impersonate":
        return `You will be logged in as "${confirm.user.name}" (${confirm.user.email}). You'll be redirected to their dashboard and can return to admin anytime from the top banner.`;
    }
  };

  const dialogButtonLabel = () => {
    switch (confirm?.type) {
      case "deactivate": return "Deactivate";
      case "delete": return "Delete";
      case "restore": return "Restore";
      case "impersonate": return "Login as User";
      default: return "Confirm";
    }
  };

  const isDestructive = confirm?.type === "deactivate" || confirm?.type === "delete";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} total users
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-9 bg-card"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user, index) => (
                    <TableRow
                      key={user.id}
                      className={user.deletedAt ? "opacity-50" : ""}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{user.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{user.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${roleStyles[user.role] ?? "bg-muted text-muted-foreground"}`}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.deletedAt ? (
                          <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200">Deleted</Badge>
                        ) : user.isActive ? (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${user.twoFactorEnabled ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}`}>
                          {user.twoFactorEnabled ? "On" : "Off"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(user.lastLoginAt)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-end">
                        {user.role !== "ADMIN" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* ── Login as User ── */}
                              {!user.deletedAt && user.isActive && (
                                <DropdownMenuItem
                                  className="text-blue-600"
                                  onClick={() => setConfirm({ type: "impersonate", user })}
                                >
                                  <LogIn className="h-4 w-4 me-2" />
                                  Login as User
                                </DropdownMenuItem>
                              )}

                              {/* Separator between impersonate and destructive actions */}
                              {!user.deletedAt && user.isActive && <DropdownMenuSeparator />}

                              {/* ── Deactivate ── */}
                              {!user.deletedAt && user.isActive && (
                                <DropdownMenuItem
                                  className="text-yellow-600"
                                  onClick={() => setConfirm({ type: "deactivate", user })}
                                >
                                  <UserX className="h-4 w-4 me-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              )}

                              {/* ── Restore (inactive) ── */}
                              {!user.deletedAt && !user.isActive && (
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() => setConfirm({ type: "restore", user })}
                                >
                                  <UserCheck className="h-4 w-4 me-2" />
                                  Restore
                                </DropdownMenuItem>
                              )}

                              {/* ── Restore (deleted) ── */}
                              {user.deletedAt && (
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() => setConfirm({ type: "restore", user })}
                                >
                                  <UserCheck className="h-4 w-4 me-2" />
                                  Restore
                                </DropdownMenuItem>
                              )}

                              {/* ── Delete ── */}
                              {!user.deletedAt && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setConfirm({ type: "delete", user })}
                                >
                                  <Trash2 className="h-4 w-4 me-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} • {total} users
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      <Dialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirm?.type === "impersonate" ? (
                <LogIn className="h-5 w-5 text-blue-600" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-destructive" />
              )}
              {dialogTitle()}
            </DialogTitle>
            <DialogDescription>
              {dialogDescription()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant={isDestructive ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {dialogButtonLabel()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}