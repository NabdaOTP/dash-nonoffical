"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api-client";
import type { BundleSlot } from "@/features/bundles/types";
import {
  Loader2, Search, MoreHorizontal, Trash2, PauseCircle,
  PlayCircle, RefreshCw, Eye, MessageSquare, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminBundle } from "@/features/admin/types";
import { deleteAdminBundle, getAdminBundles, getAdminBundleSlots, rotateAdminBundleApiKey, updateAdminBundleStatus } from "@/features/admin/services/admin-service";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const adminScope = { tokenScope: "user" as const };


function formatDate(d: string) {
  try {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  } catch { return "—"; }
}

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  SUSPENDED: "bg-red-100 text-red-700 border-red-200",
};

const slotStatusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  PAYMENT_PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  SUSPENDED: "bg-red-100 text-red-700 border-red-200",
};

type ConfirmAction =
  | { type: "delete"; bundle: AdminBundle }
  | { type: "suspend"; bundle: AdminBundle }
  | { type: "activate"; bundle: AdminBundle }
  | { type: "rotate"; bundle: AdminBundle }
  | { type: "deleteSlot"; bundleId: string; slot: BundleSlot };

// Component 
export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<AdminBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  // Slots dialog
  const [slotsBundle, setSlotsBundle] = useState<AdminBundle | null>(null);
  const [slots, setSlots] = useState<BundleSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminBundles();
      setBundles(data);
    } catch {
      toast.error("Failed to load bundles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBundles(); }, [fetchBundles]);

  const handleOpenSlots = async (bundle: AdminBundle) => {
    setSlotsBundle(bundle);
    setLoadingSlots(true);
    try {
      const data = await getAdminBundleSlots(bundle.id);
      setSlots(data);
    } catch {
      toast.error("Failed to load slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === "delete") {
        await deleteAdminBundle(confirm.bundle.id);
        toast.success("Bundle deleted");
        await fetchBundles();
      } else if (confirm.type === "suspend") {
        await updateAdminBundleStatus(confirm.bundle.id, "SUSPENDED");
        toast.success("Bundle suspended");
        await fetchBundles();
      } else if (confirm.type === "activate") {
        await updateAdminBundleStatus(confirm.bundle.id, "ACTIVE");
        toast.success("Bundle activated");
        await fetchBundles();
      } else if (confirm.type === "rotate") {
        const res = await rotateAdminBundleApiKey(confirm.bundle.id);
        toast.success(`New API key: ${res.apiKey}`);
      } else if (confirm.type === "deleteSlot") {
        await api.delete(`/api/v1/admin/bundles/${confirm.bundleId}/slots/${confirm.slot.id}`, adminScope);
        toast.success("Slot deleted");
        if (slotsBundle) await handleOpenSlots(slotsBundle);
      }
      setConfirm(null);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = bundles.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.ownerId.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Confirm dialog content
  const confirmMeta = confirm ? {
    delete: { title: "Delete Bundle", desc: `Delete "${confirm.type === "deleteSlot" ? confirm.slot.name : (confirm as { bundle: AdminBundle }).bundle?.name}"? This action cannot be undone.`, variant: "destructive" as const, label: "Delete" },
    suspend: { title: "Suspend Bundle", desc: `Suspend "${(confirm as { bundle: AdminBundle }).bundle?.name}"? All outgoing messages will stop immediately.`, variant: "destructive" as const, label: "Suspend" },
    activate: { title: "Activate Bundle", desc: `Activate "${(confirm as { bundle: AdminBundle }).bundle?.name}"?`, variant: "default" as const, label: "Activate" },
    rotate: { title: "Rotate API Key", desc: `Rotate the API key for "${(confirm as { bundle: AdminBundle }).bundle?.name}"? The old key will stop working immediately.`, variant: "destructive" as const, label: "Yes, Rotate" },
    deleteSlot: { title: "Delete Slot", desc: `Delete slot "${confirm.type === "deleteSlot" ? confirm.slot.name : ""}"?`, variant: "destructive" as const, label: "Delete Slot" },
  }[confirm.type] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bundles</h1>
        <p className="text-sm text-muted-foreground mt-1">{bundles.length} total bundles</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, slug or owner ID..."
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
                  <TableHead>Owner ID</TableHead>
                  <TableHead>API Key Prefix</TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No bundles found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((bundle, index) => (
                    <TableRow key={bundle.id}>
                      <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{bundle.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{bundle.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {bundle.ownerId}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {bundle.apiKey?.prefix ?? "—"}
                        {bundle.apiKey?.revoked && (
                          <Badge variant="outline" className="text-xs ms-1 bg-red-100 text-red-700 border-red-200">Revoked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${bundle.webhookEnabled ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}`}>
                          {bundle.webhookEnabled ? "On" : "Off"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusStyles[bundle.status] ?? "bg-muted text-muted-foreground"}`}>
                          {bundle.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(bundle.createdAt)}
                      </TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* View Slots */}
                            <DropdownMenuItem onClick={() => handleOpenSlots(bundle)}>
                              <Eye className="h-4 w-4 me-2" />
                              View Slots
                            </DropdownMenuItem>
                            {/* Messages */}
                            <DropdownMenuItem
                              onClick={() => router.push(`/${locale}/admin/bundles/${bundle.id}/messages`)}
                            >
                              <MessageSquare className="h-4 w-4 me-2" />
                              View Messages
                            </DropdownMenuItem>
                            {/* Rotate API Key */}
                            <DropdownMenuItem
                              className="text-yellow-600 focus:text-yellow-600"
                              onClick={() => setConfirm({ type: "rotate", bundle })}
                            >
                              <RefreshCw className="h-4 w-4 me-2" />
                              Rotate API Key
                            </DropdownMenuItem>
                            {/* Suspend / Activate */}
                            {bundle.status === "ACTIVE" ? (
                              <DropdownMenuItem
                                className="text-yellow-600 focus:text-yellow-600"
                                onClick={() => setConfirm({ type: "suspend", bundle })}
                              >
                                <PauseCircle className="h-4 w-4 me-2" />
                                Suspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-green-600 focus:text-green-600"
                                onClick={() => setConfirm({ type: "activate", bundle })}
                              >
                                <PlayCircle className="h-4 w-4 me-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {/* Delete */}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setConfirm({ type: "delete", bundle })}
                            >
                              <Trash2 className="h-4 w-4 me-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Slots Dialog */}
      <Dialog open={!!slotsBundle} onOpenChange={() => setSlotsBundle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Slots — {slotsBundle?.name}</DialogTitle>
            <DialogDescription>{slots.length} slots in this bundle</DialogDescription>
          </DialogHeader>
          {loadingSlots ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No slots found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot, i) => (
                  <TableRow key={slot.id}>
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="text-sm font-medium">{slot.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${slotStatusStyles[slot.status] ?? ""}`}>
                        {slot.status === "PAYMENT_PENDING" ? "Payment Pending" : slot.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {slot.session ? (
                        <Badge variant="outline" className="text-xs">{slot.session.status}</Badge>
                      ) : "No session"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {slot.expiresAt ? new Date(slot.expiresAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => slotsBundle && setConfirm({ type: "deleteSlot", bundleId: slotsBundle.id, slot })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      {confirm && confirmMeta && (
        <Dialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${confirm.type === "activate" ? "text-green-600" : "text-destructive"}`} />
                {confirmMeta.title}
              </DialogTitle>
              <DialogDescription>{confirmMeta.desc}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirm(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant={confirmMeta.variant}
                onClick={handleConfirm}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                {confirmMeta.label}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
