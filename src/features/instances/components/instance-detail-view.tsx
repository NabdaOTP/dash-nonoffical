"use client";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/features/auth/context/auth-context";
import { getAutoRenew, setAutoRenew } from "@/features/billing/services/billing-service";
import { getInstance, rotateApiKey } from "@/features/instances/services/instances-service";
import type { Instance } from "@/features/instances/types";
import { WhatsAppSection } from "@/features/whatsapp/components/WhatsAppSection";
import { connect, disconnect, restart } from "@/features/whatsapp/services/whatsapp-service";
import { ApiError } from "@/lib/api-client";
import {
  ArrowRightLeft,
  BookText,
  Check,
  Copy,
  CreditCard,
  DoorClosedLocked,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { WebhookSection } from "./WebhookSection";
import { DialogDescription } from "@radix-ui/react-dialog";

export function InstanceDetailView({ id, locale }: { id: string; locale: string }) {
  const { selectInstance } = useAuth();
  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRotateDialog, setShowRotateDialog] = useState(false);
  const [rotatingToken, setRotatingToken] = useState(false);
  const [whatsAppAction, setWhatsAppAction] = useState<"disconnect" | "restart" | "change" | null>(null);
  const [autoRenew, setAutoRenewState] = useState(false);
  const [autoRenewLoading, setAutoRenewLoading] = useState(false);
  const t = useTranslations("instances");
  const tCommon = useTranslations("common");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"logout" | "change" | "restart" | null>(null);

  const loadInstance = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setPaymentRequired(false);
    try {
      await selectInstance({ instanceId: id });
      const [data, autoRenewValue] = await Promise.all([
        getInstance(id),
        getAutoRenew(),
      ]);
      setInstance(data);
      setAutoRenewState(autoRenewValue);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setPaymentRequired(true);
      } else {
        notFound();
      }
    } finally {
      setLoading(false);
      try {
        await connect();
        await restart();
      } catch { /* silent */ }
    }
  }, [id, selectInstance]);

  useEffect(() => { loadInstance(); }, [loadInstance]);

  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get("payment") === "success";
  useEffect(() => {
    if (!paymentSuccess || !instance || loading) return;
    const initWhatsApp = async () => {
      try { await connect(); await restart(); } catch { /* silent */ }
    };
    initWhatsApp();
  }, [paymentSuccess, instance, loading]);

  const handleCopy = async (value: string, field: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const handleRotateToken = async () => {
    if (!instance) return;
    setRotatingToken(true);
    try {
      const result = await rotateApiKey();
      setInstance((prev) => prev ? { ...prev, apiKey: result.apiKey } : prev);
      toast.success(t("tokenRotated"));
      setShowRotateDialog(false);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("tokenRotateFailed"));
    } finally {
      setRotatingToken(false);
    }
  };

  const handleWhatsAppDisconnect = async (reason: "logout" | "change") => {
    setWhatsAppAction(reason === "logout" ? "disconnect" : "change");
    try {
      await disconnect();
      toast.success(reason === "logout" ? t("whatsappDisconnected") : t("whatsappChanged"));
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("disconnectFailed"));
    } finally {
      setWhatsAppAction(null);
    }
  };

  const handleWhatsAppRestart = async () => {
    setWhatsAppAction("restart");
    try {
      await restart();
      toast.success(t("whatsappRestarted"));
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("restartFailed"));
    } finally {
      setWhatsAppAction(null);
    }
  };

  const handleAutoRenewChange = async (checked: boolean) => {
    setAutoRenewLoading(true);
    const prev = autoRenew;
    setAutoRenewState(checked);
    try {
      await setAutoRenew(checked);
      toast.success(t("autoRenewUpdated"));
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? t("autoRenewFailed"));
      setAutoRenewState(prev);
    } finally {
      setAutoRenewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (paymentRequired) {
    return (
      <div className="p-12 text-center max-w-2xl mx-auto">
        <div className="text-6xl mb-6"><DoorClosedLocked /></div>
        <h2 className="text-3xl font-bold">{t("paymentRequired")}</h2>
        <p className="mt-3 text-muted-foreground">{t("paymentRequiredDesc")}</p>
        <Button asChild size="lg" className="mt-8 cursor-pointer">
          <Link href={`/${locale}/billing/subscribe?instanceId=${id}`}>{t("payNow")}</Link>
        </Button>
      </div>
    );
  }

  if (!instance) return null;

  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://api.nabdaotp.com"}/inst/${id}`;
  const tokenValue = instance.apiKey || instance.token || "";

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${locale}/dashboard`}>{t("home")}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${locale}/instances`}>{t("instances")}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>#{id.slice(0, 8)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="border-b bg-card px-4 sm:px-6 py-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-lg sm:text-2xl font-semibold break-all">{t("instanceTitle")}{id.slice(0, 8)}</span>
              <span className="text-muted-foreground text-sm sm:text-base">{instance.name || t("unnamed")}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 ms-auto w-fit sm:flex sm:flex-wrap gap-2">
            <a href="https://api.nabdaotp.com/docs" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto cursor-pointer">
                <BookText className="h-4 w-4 mr-1" />
                {t("apiDocs")}
              </Button>
            </a>
            <Link href={`/${locale}/instances/${id}/messages`} className="w-full sm:w-auto">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto cursor-pointer">
                <MessageCircle className="h-4 w-4 mr-1" />
                {t("messages")}
              </Button>
            </Link>
            {/*  Invoices button */}
            <Link href={`/${locale}/instances/${id}/invoices`} className="w-full sm:w-auto">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto cursor-pointer">
                <CreditCard className="h-4 w-4 mr-1" />
                {t("invoices")}
              </Button>
            </Link>
            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full sm:w-auto text-destructive cursor-pointer"
              onClick={() => {
                setPendingAction("logout");
                setShowConfirmDialog(true);
              }}
              disabled={whatsAppAction === "disconnect"}
            >
              {whatsAppAction === "disconnect" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <LogOut className="h-4 w-4 mr-1" />}
              {t("logout")}
            </Button>
            {/* Change Number Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full sm:w-auto cursor-pointer"
              onClick={() => {
                setPendingAction("change");
                setShowConfirmDialog(true);
              }}
              disabled={whatsAppAction === "change"}
            >
              {whatsAppAction === "change" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ArrowRightLeft className="h-4 w-4 mr-1" />}
              {t("changeNumber")}
            </Button>

            {/* Restart Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full sm:w-auto cursor-pointer"
              onClick={() => {
                setPendingAction("restart");
                setShowConfirmDialog(true);
              }}
              disabled={whatsAppAction === "restart"}
            >
              {whatsAppAction === "restart" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RotateCw className="h-4 w-4 mr-1" />}
              {t("restart")}
            </Button>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          <Card className="overflow-hidden border border-border shadow-sm">
            <CardHeader className="bg-muted/30 py-4">
              <CardTitle className="text-base font-semibold">{t("credentials")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed min-w-200">
                  <thead>
                    <tr className="border-b bg-[#ede9fe] border-[#c4b5fd]">
                      <th className="text-left text-sm font-medium text-[#5b21b6] px-4 py-3 w-40">
                        {t("authStatus")}
                      </th>
                      <th className="text-left text-sm font-medium text-[#5b21b6] px-4 py-3">
                        {t("apiUrl")}
                      </th>
                      <th className="text-left text-sm font-medium text-[#5b21b6] px-4 py-3">
                        {t("instanceId")}
                      </th>
                      <th className="text-left text-sm font-medium text-[#5b21b6] px-4 py-3">
                        {t("token")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#faf5ff]">
                      <td className="px-4 py-4">
                        <Badge className={
                          instance.status === "ACTIVE" || instance.status === t("active")
                            ? "bg-[#16a34a] hover:bg-[#15803d] text-white border-0 text-xs font-semibold"
                            : instance.status === "TRIAL"
                              ? "bg-blue-500 hover:bg-blue-600 text-white border-0 text-xs font-semibold"
                              : instance.status === "PAYMENT_PENDING"
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white border-0 text-xs font-semibold"
                                : "bg-red-500 hover:bg-red-600 text-white border-0 text-xs font-semibold"
                        }>
                          {instance.status === "ACTIVE" || instance.status === "active" ? t("authenticated")
                            : instance.status === "TRIAL" ? "Trial"
                              : instance.status === "PAYMENT_PENDING" ? t("paymentPending")
                                : instance.status === "inactive" ? "Inactive" : "Error"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Input readOnly value={apiUrl} className="text-sm font-mono bg-white border border-[#d1d5db] rounded-md px-3 py-1.5 w-full truncate focus:outline-none text-gray-700 cursor-default" />
                          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => handleCopy(apiUrl, "apiUrl")}>
                            {copiedField === "apiUrl" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Input readOnly value={id} className="text-sm font-mono bg-white border border-[#d1d5db] rounded-md px-3 py-1.5 w-full truncate focus:outline-none text-gray-700 cursor-default" />
                          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => handleCopy(id, "instanceId")}>
                            {copiedField === "instanceId" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Input readOnly value={instance.apiKey} className="text-sm font-mono bg-white border border-[#d1d5db] rounded-md px-3 py-1.5 w-full truncate focus:outline-none text-gray-700 cursor-default" />
                          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => handleCopy(tokenValue, "token")}>
                            {copiedField === "token" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => setShowRotateDialog(true)} title="Rotate token">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {/* What's app section */}
          <div className="mt-8">
            {instance && <WhatsAppSection key={instance.id} instanceId={id} locale={locale} />}
          </div>
          {/* WebhookSection */}
          <WebhookSection
            webhookUrl={instance.webhookUrl}
            webhookEnabled={instance.webhookEnabled}
          />
          {/* Subscription section */}
          {(instance.status === "ACTIVE" || instance.status === "TRIAL") && (
            <Card className="mt-6 overflow-hidden border border-border shadow-sm">
              <CardHeader className="bg-purple-100/30 py-4 pt-6">
                <CardTitle className="text-base font-semibold">{t("subscriptionSettings")}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{t("autoRenew")}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{t("autoRenewDesc")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {autoRenewLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Switch checked={autoRenew} onCheckedChange={handleAutoRenewChange} disabled={autoRenewLoading} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === "logout" && t("confirmLogout")}
              {pendingAction === "change" && t("confirmChangeNumber")}
              {pendingAction === "restart" && t("confirmRestart")}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === "logout" && t("confirmLogoutDesc")}
              {pendingAction === "change" && t("confirmChangeNumberDesc")}
              {pendingAction === "restart" && t("confirmRestartDesc")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={whatsAppAction !== null}
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button
              className="cursor-pointer"
              variant={pendingAction === "logout" ? "destructive" : "default"}
              onClick={async () => {
                if (!pendingAction) return;

                setShowConfirmDialog(false);

                if (pendingAction === "logout" || pendingAction === "change") {
                  await handleWhatsAppDisconnect(pendingAction);
                } else if (pendingAction === "restart") {
                  await handleWhatsAppRestart();
                }

                setPendingAction(null);
              }}
              disabled={whatsAppAction !== null}
            >
              {pendingAction === "logout" && t("logout")}
              {pendingAction === "change" && t("changeNumber")}
              {pendingAction === "restart" && t("restart")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRotateDialog} onOpenChange={setShowRotateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("rotateToken")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">{t("rotateTokenConfirm")}</p>
          <DialogFooter className="mt-4">
            <Button className="cursor-pointer" variant="outline" onClick={() => setShowRotateDialog(false)} disabled={rotatingToken}>{t("cancel")}</Button>
            <Button className="bg-linear-to-r cursor-pointer from-[#A78BFA] to-[#7C3AED] hover:from-[#9F7AEA] hover:to-[#6D28D9] text-white" onClick={handleRotateToken} disabled={rotatingToken}>
              {rotatingToken ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rotate Token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}