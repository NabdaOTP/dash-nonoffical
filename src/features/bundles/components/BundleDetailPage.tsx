"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  getBundleById, getBundleSlots, updateBundle,
  purchaseBundleSlot, repurchaseBundleSlot, deleteBundleSlot, rotateBundleApiKey,
} from "@/features/bundles/services/bundle-service";
import { manageSubscription } from "@/features/billing/services/billing-service";
import { useAuth } from "@/features/auth/context/auth-context";
import type { BundleDetails, BundleSlot } from "@/features/bundles/types";
import {
  Loader2, Webhook, Key, Plus, Trash2, RefreshCw,
  Copy, Check, ArrowLeft, Server, Wifi, WifiOff,
  CreditCard, AlertTriangle, MessageSquare,
  ChevronDown, CalendarDays, CalendarRange, ExternalLink, MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const slotStatusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  PAYMENT_PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  SUSPENDED: "bg-red-100 text-red-700 border-red-200",
};

const sessionStatusStyles: Record<string, string> = {
  CONNECTED: "bg-green-100 text-green-700 border-green-200",
  CONNECTING: "bg-blue-100 text-blue-700 border-blue-200",
  RECONNECTING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  DISCONNECTED: "bg-gray-100 text-gray-600 border-gray-200",
};

export function BundleDetailPage({ bundleId }: { bundleId: string }) {
  const [bundle, setBundle] = useState<BundleDetails | null>(null);
  const [slots, setSlots] = useState<BundleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);

  const [rotating, setRotating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);

  const [purchasing, setPurchasing] = useState(false);
  const [openAddSlotMenu, setOpenAddSlotMenu] = useState(false);
  const [payingSlotId, setPayingSlotId] = useState<string | null>(null);
  const [openPayMenuId, setOpenPayMenuId] = useState<string | null>(null);
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const [confirmDeleteSlotId, setConfirmDeleteSlotId] = useState<string | null>(null);
  const [managingSlotId, setManagingSlotId] = useState<string | null>(null); // ✅

  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("bundles");
  const { selectInstance } = useAuth();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bundleData, slotsData] = await Promise.all([
        getBundleById(bundleId),
        getBundleSlots(bundleId),
      ]);
      setBundle(bundleData);
      setSlots(slotsData);
      setWebhookUrl(bundleData.webhookUrl ?? "");
      setWebhookEnabled(bundleData.webhookEnabled);
    } catch {
      toast.error(t("toast.loadDetailError"));
    } finally {
      setLoading(false);
    }
  }, [bundleId, t]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaveWebhook = async () => {
    if (webhookEnabled && !webhookUrl.trim()) {
      toast.error(t("toast.webhookUrlRequired"));
      return;
    }
    if (webhookEnabled && !webhookUrl.startsWith("https://")) {
      toast.error(t("toast.webhookUrlHttps"));
      return;
    }
    setSavingWebhook(true);
    try {
      await updateBundle(bundleId, { webhookUrl: webhookUrl.trim(), webhookEnabled });
      toast.success(t("toast.webhookSaved"));
      await fetchAll();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("toast.webhookError"));
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleRotateKey = async () => {
    setShowRotateConfirm(false);
    setRotating(true);
    try {
      const result = await rotateBundleApiKey(bundleId);
      setNewApiKey(result.apiKey);
      toast.success(t("toast.apiKeyRotated"));
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("toast.apiKeyRotateError"));
    } finally {
      setRotating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Add new slot 
  const handlePurchaseSlot = async (interval: "MONTHLY" | "YEARLY") => {
    setOpenAddSlotMenu(false);
    setPurchasing(true);
    try {
      const result = await purchaseBundleSlot(bundleId, interval);
      if (result.checkoutUrl) window.location.href = result.checkoutUrl;
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("toast.purchaseError"));
      setPurchasing(false);
    }
  };

  // Repurchase existing slot 
  const handleRepurchaseSlot = async (slotId: string, interval: "MONTHLY" | "YEARLY") => {
    setOpenPayMenuId(null);
    setPayingSlotId(slotId);
    try {
      const result = await repurchaseBundleSlot(bundleId, slotId, interval);
      if (result.checkoutUrl) window.location.href = result.checkoutUrl;
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("toast.purchaseError"));
      setPayingSlotId(null);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    setDeletingSlotId(slotId);
    setConfirmDeleteSlotId(null);
    try {
      await deleteBundleSlot(bundleId, slotId);
      toast.success(t("toast.slotDeleted"));
      await fetchAll();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("toast.slotDeleteError"));
    } finally {
      setDeletingSlotId(null);
    }
  };

  // Manage Subscription — Stripe Customer Portal
  const handleManageSubscription = async (slotId: string) => {
    setManagingSlotId(slotId);
    try {
      await selectInstance({ instanceId: slotId });
      const result = await manageSubscription();
      if (result?.url) {
        window.open(result.url, "_blank");
      } else {
        toast.error(t("toast.noPortalUrl"));
      }
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("toast.manageSubscriptionError"));
    } finally {
      setManagingSlotId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!bundle) {
    return <div className="text-center py-20 text-muted-foreground">{t("detail.notFound")}</div>;
  }


  const displayApiKey = newApiKey ?? (typeof bundle.apiKey === "string" ? bundle.apiKey : null);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button className="cursor-pointer" variant="ghost" size="icon" onClick={() => router.push(`/${locale}/bundles`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{bundle.name}</h1>
          <p className="text-xs text-muted-foreground font-mono">{bundle.slug}</p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            className="gap-2 cursor-pointer"
            onClick={() => router.push(`/${locale}/bundles/${bundleId}/messages`)}
          >
            <MessageSquare className="h-4 w-4" />
            {t("detail.messagesButton")}
          </Button>
          <Badge variant="outline" className={bundle.status === "ACTIVE" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
            {t(`status.${bundle.status}`)}
          </Badge>
        </div>
      </div>

      {/* Slots */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                {t("detail.slots.title")}
                <Badge variant="outline" className="text-xs">{slots.length}</Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-1">{t("detail.slots.description")}</CardDescription>
            </div>

            {/* Add Slot dropdown — monthly/yearly */}
            <DropdownMenu open={openAddSlotMenu} onOpenChange={setOpenAddSlotMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  disabled={purchasing}
                  className="gradient-primary text-primary-foreground gap-1.5 cursor-pointer"
                >
                  {purchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {purchasing ? t("detail.slots.redirecting") : t("detail.slots.addSlot")}
                  {!purchasing && <ChevronDown className="h-3 w-3" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {t("detail.slots.choosePlan")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => handlePurchaseSlot("MONTHLY")}>
                  <CalendarDays className="h-4 w-4 me-2 text-[#7C3AED]" />
                  <div>
                    <p className="font-medium">{t("detail.slots.monthly")}</p>
                    <p className="text-xs text-muted-foreground">{t("detail.slots.monthlyPrice")}</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => handlePurchaseSlot("YEARLY")}>
                  <CalendarRange className="h-4 w-4 me-2 text-[#7C3AED]" />
                  <div>
                    <p className="font-medium">{t("detail.slots.annual")}</p>
                    <p className="text-xs text-muted-foreground">{t("detail.slots.annualPrice")}</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {slots.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Server className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t("detail.slots.empty")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>#</TableHead>
                  <TableHead>{t("detail.slots.table.name")}</TableHead>
                  <TableHead>{t("detail.slots.table.status")}</TableHead>
                  <TableHead>{t("detail.slots.table.session")}</TableHead>
                  <TableHead>{t("detail.slots.table.phone")}</TableHead>
                  <TableHead>{t("detail.slots.table.expires")}</TableHead>
                  <TableHead className="text-end">{t("detail.slots.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot, index) => {
                  const isPending = slot.status === "PAYMENT_PENDING";
                  const isActive = slot.status === "ACTIVE";
                  return (
                    <TableRow
                      key={slot.id}
                      className={isActive ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                      onClick={() => isActive && router.push(`/${locale}/instances/${slot.id}`)}
                    >
                      <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="text-sm font-medium">{slot.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${slotStatusStyles[slot.status] ?? ""}`}>
                          {t(`slotStatus.${slot.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {slot.session ? (
                          <Badge variant="outline" className={`text-xs flex items-center gap-1 w-fit ${sessionStatusStyles[slot.session.status] ?? ""}`}>
                            {slot.session.status === "CONNECTED"
                              ? <Wifi className="h-3 w-3" />
                              : <WifiOff className="h-3 w-3" />}
                            {t(`sessionStatus.${slot.session.status}`)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t("detail.slots.noSession")}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {slot.session?.phoneNumber ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {slot.expiresAt ? new Date(slot.expiresAt).toLocaleDateString() : "—"}
                      </TableCell>

                      <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Manage — active only */}
                          {isActive && (
                            <Button
                              size="sm" variant="default"
                              className="h-7 px-2 text-xs bg-blue-500 hover:bg-blue-600 text-white gap-1 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); router.push(`/${locale}/instances/${slot.id}`); }}
                            >
                              {t("detail.slots.manageInstance")}
                            </Button>
                          )}

                          {/* Pay dropdown — PAYMENT_PENDING only */}
                          {isPending && (
                            <DropdownMenu
                              open={openPayMenuId === slot.id}
                              onOpenChange={(open) => setOpenPayMenuId(open ? slot.id : null)}
                            >
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm" variant="default"
                                  className="h-7 px-2 text-xs bg-linear-to-r from-[#A78BFA] to-[#7C3AED] hover:from-[#9F7AEA] hover:to-[#6D28D9] text-white gap-1 cursor-pointer"
                                  disabled={payingSlotId === slot.id}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {payingSlotId === slot.id
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <CreditCard className="h-3 w-3" />}
                                  {t("detail.slots.pay")}
                                  {payingSlotId !== slot.id && <ChevronDown className="h-3 w-3" />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                  {t("detail.slots.choosePlan")}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleRepurchaseSlot(slot.id, "MONTHLY")}
                                  disabled={payingSlotId === slot.id}
                                >
                                  <CalendarDays className="h-4 w-4 me-2 text-[#7C3AED]" />
                                  <div>
                                    <p className="font-medium">{t("detail.slots.monthly")}</p>
                                    <p className="text-xs text-muted-foreground">{t("detail.slots.monthlyPrice")}</p>
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleRepurchaseSlot(slot.id, "YEARLY")}
                                  disabled={payingSlotId === slot.id}
                                >
                                  <CalendarRange className="h-4 w-4 me-2 text-[#7C3AED]" />
                                  <div>
                                    <p className="font-medium">{t("detail.slots.annual")}</p>
                                    <p className="text-xs text-muted-foreground">{t("detail.slots.annualPrice")}</p>
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {/* Delete */}
                          {!isActive && (
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteSlotId(slot.id); }}
                              disabled={deletingSlotId === slot.id}
                            >
                              {deletingSlotId === slot.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Trash2 className="h-4 w-4" />}
                            </Button>
                          )}
                          {/* Manage Subscription dropdown — active only */}
                          {isActive && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-8 w-8 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleManageSubscription(slot.id)}
                                  disabled={managingSlotId === slot.id}
                                >
                                  {managingSlotId === slot.id
                                    ? <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                    : <ExternalLink className="h-4 w-4 me-2" />}
                                  {t("detail.slots.manageSubscription")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* API Key */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t("detail.apiKey.title")}</CardTitle>
          </div>
          <CardDescription className="text-xs">{t("detail.apiKey.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {/* full api key */}
            <div className="flex-1 bg-muted rounded-lg px-4 py-2.5 font-mono text-sm break-all">
              {newApiKey ?? (typeof bundle.apiKey === "string" ? bundle.apiKey : "—")}
            </div>
            <Button
              className="cursor-pointer shrink-0"
              variant="outline" size="icon"
              onClick={() => displayApiKey && handleCopy(displayApiKey)}
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            variant="outline" size="sm"
            onClick={() => setShowRotateConfirm(true)}
            disabled={rotating}
            className="gap-2 text-destructive cursor-pointer border-destructive/30 hover:bg-destructive/5"
          >
            {rotating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t("detail.apiKey.rotateKey")}
          </Button>
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{t("detail.webhook.title")}</CardTitle>
            </div>
            <Badge variant="outline" className={`text-xs ${webhookEnabled ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}`}>
              {webhookEnabled ? t("detail.webhook.enabled") : t("detail.webhook.disabled")}
            </Badge>
          </div>
          <CardDescription className="text-xs">{t("detail.webhook.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("detail.webhook.enableLabel")}</p>
              <p className="text-xs text-muted-foreground">{t("detail.webhook.enableDescription")}</p>
            </div>
            <Switch className="cursor-pointer" checked={webhookEnabled} onCheckedChange={setWebhookEnabled} disabled={savingWebhook} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{t("detail.webhook.urlLabel")}</Label>
            <Input
              placeholder={t("detail.webhook.urlPlaceholder")}
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              disabled={savingWebhook || !webhookEnabled}
              className={!webhookEnabled ? "opacity-50" : ""}
            />
          </div>
          <Button onClick={handleSaveWebhook} disabled={savingWebhook} className="w-full gradient-primary text-primary-foreground cursor-pointer">
            {savingWebhook ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Webhook className="h-4 w-4 me-2" />}
            {t("detail.webhook.saveButton")}
          </Button>
        </CardContent>
      </Card>

      {/* Rotate API Key Confirmation */}
      <Dialog open={showRotateConfirm} onOpenChange={setShowRotateConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t("detail.rotateDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("detail.rotateDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRotateConfirm(false)}>{t("detail.rotateDialog.cancel")}</Button>
            <Button variant="destructive" onClick={handleRotateKey} disabled={rotating}>
              {rotating && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t("detail.rotateDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Slot Confirm */}
      <Dialog open={!!confirmDeleteSlotId} onOpenChange={() => setConfirmDeleteSlotId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("detail.slots.deleteDialog.title")}</DialogTitle>
            <DialogDescription>{t("detail.slots.deleteDialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="cursor-pointer" variant="outline" onClick={() => setConfirmDeleteSlotId(null)}>
              {t("detail.slots.deleteDialog.cancel")}
            </Button>
            <Button
              className="cursor-pointer"
              variant="destructive"
              onClick={() => confirmDeleteSlotId && handleDeleteSlot(confirmDeleteSlotId)}
              disabled={!!deletingSlotId}
            >
              {deletingSlotId && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t("detail.slots.deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}