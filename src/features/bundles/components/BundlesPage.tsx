"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import {
  getMyBundles, createBundle, deleteBundle, updateBundleStatus,
} from "@/features/bundles/services/bundle-service";
import type { Bundle } from "@/features/bundles/types";
import {
  Loader2, Plus, MoreHorizontal, Trash2, Package,
  PauseCircle, PlayCircle, Rocket, Zap, Shield, Webhook,
  AlertTriangle, WifiOff, ServerCrash,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const statusStyles: Record<string, string> = {
  ACTIVE:    "bg-green-100 text-green-700 border-green-200",
  SUSPENDED: "bg-red-100 text-red-700 border-red-200",
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch { return "—"; }
}

// Empty State 

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  const t = useTranslations("bundles");

  const features = [
    {
      icon: <Zap className="h-4 w-4 text-amber-500" />,
      title: t("empty.feature1Title"),
      desc: t("empty.feature1Desc"),
    },
    {
      icon: <Shield className="h-4 w-4 text-blue-500" />,
      title: t("empty.feature2Title"),
      desc: t("empty.feature2Desc"),
    },
    {
      icon: <Webhook className="h-4 w-4 text-violet-500" />,
      title: t("empty.feature3Title"),
      desc: t("empty.feature3Desc"),
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Top illustration / hero area */}
      <div className="bg-gradient-to- from-primary/5 via-primary/10 to-transparent px-10 pt-10 pb-6 text-center border-b border-border py-2">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Package className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-foreground">{t("empty.title")}</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
          {t("empty.description")}
        </p>
      </div>

      {/* Feature breakdown */}
      <div className="grid grid-cols-1 space-y-4 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border py-3 pt-5">
        {features.map((f, i) => (
          <div key={i} className="px-6 py-5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-medium text-sm text-foreground">
              {f.icon}
              {f.title}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-10 py-6 text-center">
        <Button
          onClick={onCreateClick}
          className="gradient-primary text-primary-foreground gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {t("empty.cta")}
        </Button>
        <p className="text-xs text-muted-foreground mt-3">{t("empty.hint")}</p>
      </div>
    </div>
  );
}

// Suspend Confirmation Dialog 
function SuspendConfirmDialog({
  bundle,
  open,
  loading,
  onConfirm,
  onCancel,
}: {
  bundle: Bundle | null;
  open: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("bundles");

  const consequences = [
    {
      icon: <WifiOff className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />,
      text: t("suspendDialog.consequence1"),
    },
    {
      icon: <ServerCrash className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />,
      text: t("suspendDialog.consequence2"),
    },
    {
      icon: <Webhook className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />,
      text: t("suspendDialog.consequence3"),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <DialogTitle className="text-base">
              {t("suspendDialog.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed">
            {t("suspendDialog.description", { name: bundle?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        {/* Consequences */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
            {t("suspendDialog.consequencesTitle")}
          </p>
          {consequences.map((c, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-red-700">
              {c.icon}
              <span>{c.text}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {t("suspendDialog.reactivateNote")}
        </p>

        <DialogFooter className="gap-2">
          <Button className="cursor-pointer" variant="outline" onClick={onCancel} disabled={loading}>
            {t("suspendDialog.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            <PauseCircle className="h-4 w-4 me-2" />
            {t("suspendDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Page 

export function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createWebhook, setCreateWebhook] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Toggle / Suspend
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Bundle | null>(null); // bundle pending suspend confirm

  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("bundles");

  const fetchBundles = useCallback(async () => {
    try {
      const data = await getMyBundles();
      setBundles(data);
    } catch {
      toast.error(t("toast.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBundles(); }, [fetchBundles]);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      await createBundle({
        name: createName.trim(),
        webhookUrl: createWebhook.trim() || undefined,
      });
      toast.success(t("toast.createSuccess"));
      setShowCreate(false);
      setCreateName("");
      setCreateWebhook("");
      await fetchBundles();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("toast.createError"));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await deleteBundle(id);
      toast.success(t("toast.deleteSuccess"));
      await fetchBundles();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("toast.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Called from the dropdown.
   * - If bundle is SUSPENDED → activate immediately (low risk, no confirm needed).
   * - If bundle is ACTIVE → show the suspend confirmation dialog first.
   */
  const handleToggleStatus = (bundle: Bundle) => {
    if (bundle.status === "ACTIVE") {
      setSuspendTarget(bundle);
    } else {
      executeToggle(bundle, "ACTIVE");
    }
  };

  const executeToggle = async (bundle: Bundle, newStatus: "ACTIVE" | "SUSPENDED") => {
    setTogglingId(bundle.id);
    setSuspendTarget(null);
    try {
      await updateBundleStatus(bundle.id, newStatus);
      toast.success(newStatus === "ACTIVE" ? t("toast.activated") : t("toast.suspended"));
      await fetchBundles();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("toast.statusError"));
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("page.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("page.description")}
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="gradient-primary text-primary-foreground gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {t("page.newBundle")}
        </Button>
      </div>

      {/* Empty State */}
      {bundles.length === 0 ? (
        <EmptyState onCreateClick={() => setShowCreate(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          {bundles.map((bundle) => (
            <Card key={bundle.id} className="border border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/${locale}/bundles/${bundle.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 ">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{bundle.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{bundle.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-xs ${statusStyles[bundle.status] ?? ""}`}>
                      {t(`status.${bundle.status}`)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {e.stopPropagation(); handleToggleStatus(bundle)}}
                          disabled={togglingId === bundle.id}
                        >
                          {togglingId === bundle.id
                            ? <Loader2 className="h-4 w-4 me-2 animate-spin" />
                            : bundle.status === "ACTIVE"
                            ? <PauseCircle className="h-4 w-4 me-2 text-yellow-600" />
                            : <PlayCircle className="h-4 w-4 me-2 text-green-600" />}
                          {bundle.status === "ACTIVE" ? t("actions.suspend") : t("actions.activate")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {e.stopPropagation(); setConfirmDeleteId(bundle.id)}}
                          disabled={deletingId === bundle.id}
                        >
                          {deletingId === bundle.id
                            ? <Loader2 className="h-4 w-4 me-2 animate-spin" />
                            : <Trash2 className="h-4 w-4 me-2" />}
                          {t("actions.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("card.createdAt", { date: formatDate(bundle.createdAt) })}</span>
                  <Button
                    variant="default" size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white gap-1.5 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); router.push(`/${locale}/bundles/${bundle.id}`); }}
                  >
                    {t("card.manage")}
                    <Rocket className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("createDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("createDialog.nameLabel")} <span className="text-destructive">*</span></Label>
              <Input
                placeholder={t("createDialog.namePlaceholder")}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t("createDialog.webhookLabel")}{" "}
                <span className="text-muted-foreground text-xs">{t("createDialog.optional")}</span>
              </Label>
              <Input
                placeholder={t("createDialog.webhookPlaceholder")}
                value={createWebhook}
                onChange={(e) => setCreateWebhook(e.target.value)}
                disabled={creating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="cursor-pointer" variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
              {t("createDialog.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !createName.trim()}
              className="gradient-primary text-primary-foreground cursor-pointer"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t("createDialog.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("deleteDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="cursor-pointer" variant="outline" onClick={() => setConfirmDeleteId(null)}>
              {t("deleteDialog.cancel")}
            </Button>
            <Button
            className="cursor-pointer"
              variant="destructive"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              disabled={!!deletingId}
            >
              {deletingId && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Confirm Dialog */}
      <SuspendConfirmDialog
        bundle={suspendTarget}
        open={!!suspendTarget}
        loading={togglingId === suspendTarget?.id}
        onConfirm={() => suspendTarget && executeToggle(suspendTarget, "SUSPENDED")}
        onCancel={() => setSuspendTarget(null)}
      />
    </div>
  );
}