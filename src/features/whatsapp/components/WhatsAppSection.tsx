"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/context/auth-context";
import { getInstance } from "@/features/instances/services/instances-service";
import { sendMessage } from "@/features/messages/services/messages-service";
import { CheckCircle2, Loader2, RefreshCw, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { connect, disconnect, getQrCode, getStatus, restart } from "../services/whatsapp-service";
import type { WhatsAppStatus } from "../types";

interface WhatsAppSectionProps {
  instanceId: string;
  locale?: string;
}

function normalizeStatus(status: string): string {
  return status?.toLowerCase() ?? "";
}

async function generateQrDataUrl(qrString: string): Promise<string> {
  if (qrString.startsWith("data:image")) return qrString;
  if (!qrString.includes(",") && !qrString.includes("@")) {
    return `data:image/png;base64,${qrString}`;
  }
  return QRCode.toDataURL(qrString, { width: 300, margin: 2 });
}

function WhatsAppSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <Skeleton className="w-48 h-48 rounded-lg" />
          </div>
          <div className="space-y-2">
            {[75, 80, 85, 90].map((w) => (
              <Skeleton key={w} className="h-4 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24 rounded" />
            <Skeleton className="h-9 w-28 rounded" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <Skeleton className="h-6 w-44" />
        </div>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-32 rounded-full" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28 rounded" />
            <Skeleton className="h-9 w-24 rounded" />
            <Skeleton className="h-9 w-24 rounded" />
          </div>
          <div className="border-t pt-6 space-y-4">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-24 w-full rounded" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WhatsAppSection({ instanceId, locale = "en" }: WhatsAppSectionProps) {
  const { selectInstance } = useAuth();
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; is401?: boolean } | null>(null);
  const [sendPhone, setSendPhone] = useState("");
  const [sendText, setSendText] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshingQr, setRefreshingQr] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const t = useTranslations("instances");
  const tCommon = useTranslations("common");
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  
  const applyQr = useCallback(async (qrString: string | null) => {
    if (!qrString) { setQr(null); return; }
    try {
      const dataUrl = await generateQrDataUrl(qrString);
      setQr(dataUrl);
    } catch {
      setQr(null);
    }
  }, []);

  const refreshInstanceToken = useCallback(async () => {
    try {
      await selectInstance({ instanceId });
    } catch {
      // silent
    }
  }, [instanceId, selectInstance]);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      setError(null);

      const [stat, inst] = await Promise.allSettled([
        getStatus(),
        getInstance(instanceId),
      ]);

      if (stat.status === "rejected") {
        const errStatus = (stat.reason as { status?: number })?.status;
        if (errStatus === 401) {
          await refreshInstanceToken();
          return;
        }
      }

      if (stat.status === "fulfilled") {
        setStatus(stat.value);
        if (stat.value.qr) {
          await applyQr(stat.value.qr);
        } else {
          const normalized = normalizeStatus(stat.value.status);
          if (normalized === "qr_ready" || normalized === "disconnected") {
            try {
              const qrRes = await getQrCode();
              await applyQr(qrRes?.qr ?? null);
            } catch {
              setQr(null);
            }
          } else {
            setQr(null);
          }
        }
      }

      if (inst.status === "fulfilled" && inst.value.apiKey) {
        setApiKey(inst.value.apiKey);
      }

    } catch (err: unknown) {
      const errStatus = (err as { status?: number })?.status;
      if (errStatus === 403) {
        setError({ message: "Instance not active or missing scoped token. Complete payment first." });
      } else if (errStatus === 401) {
        await refreshInstanceToken();
      } else if (!isInitial) {
        setError({ message: "Failed to load WhatsApp status" });
      }
    } finally {
      setLoading(false);
    }
  }, [instanceId, applyQr, refreshInstanceToken]);


  useEffect(() => {
    if (error?.is401) return;
    fetchData(true);
    const isConnecting = normalizeStatus(status?.status ?? "") === "connecting";
    const interval = setInterval(() => fetchData(false), isConnecting ? 5000 : 30000);
    return () => clearInterval(interval);
  }, [instanceId, fetchData, error?.is401, status?.status]);

  // ====================== Page Visibility Fix ======================
  // This fixes the tab freezing / inactivity issue
  const handlePageBecomeVisible = useCallback(() => {
    if (document.visibilityState === "visible") {
      fetchData(false);   // Refresh WhatsApp status when user returns to the tab
    }
  }, [fetchData]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handlePageBecomeVisible);
    window.addEventListener("focus", handlePageBecomeVisible);

    return () => {
      document.removeEventListener("visibilitychange", handlePageBecomeVisible);
      window.removeEventListener("focus", handlePageBecomeVisible);
    };
  }, [handlePageBecomeVisible]);

  const handleRefreshQr = useCallback(async () => {
    if (normalizeStatus(status?.status ?? "") === "connected") return;
    setRefreshingQr(true);

    let attempts = 0;
    const maxAttempts = 10;

    const tryGetQr = async (): Promise<void> => {
      attempts++;
      try {
        const stat = await getStatus();
        setStatus(stat);
        if (stat.qr) {
          await applyQr(stat.qr);
          toast.success("QR code ready. Scan to connect.");
          setRefreshingQr(false);
          return;
        }
        const r = await getQrCode();
        if (r?.qr) {
          await applyQr(r.qr);
          toast.success("QR code ready. Scan to connect.");
          setRefreshingQr(false);
          return;
        }
      } catch { }

      if (attempts < maxAttempts) {
        await new Promise((res) => setTimeout(res, 5000));
        await tryGetQr();
      } else {
        toast.error("QR code not ready. Try clicking Connect again.");
        setRefreshingQr(false);
      }
    };

    await tryGetQr();
  }, [status?.status, applyQr]);

  const handleConnect = useCallback(async () => {
    if (normalizeStatus(status?.status ?? "") === "connected") return;
    setConnecting(true);
    try {
      if (normalizeStatus(status?.status ?? "") !== "connecting") {
        await connect();
      }
      toast.info("WhatsApp is starting up. QR code will appear automatically...");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Failed to connect";
      if (!msg.toLowerCase().includes("timed out") && !msg.toLowerCase().includes("timeout")) {
        toast.error(msg);
      }
    } finally {
      setConnecting(false);
    }
  }, [status?.status]);

  const handleSendMessage = useCallback(async () => {
    const phone = sendPhone.trim();
    const message = sendText.trim();
    if (!phone || !message) {
      toast.error("Please enter phone number and message");
      return;
    }
    if (!phone.startsWith("+")) {
      toast.error("Phone must start with + and include country code");
      return;
    }
    if (!apiKey) {
      toast.error("API key not available. Please refresh the page.");
      return;
    }
    setSending(true);
    try {
      await sendMessage({ phone, message }, apiKey);
      toast.success("Message sent");
      setSendText("");
    } catch (err: unknown) {
      const errStatus = (err as { status?: number })?.status;
      const msg = (err as { message?: string })?.message ?? "Failed to send message";

      if (errStatus === 401) {
        try {
          await refreshInstanceToken();
          const inst = await getInstance(instanceId);
          if (inst.apiKey) {
            setApiKey(inst.apiKey);
            await sendMessage({ phone, message }, inst.apiKey);
            toast.success("Message sent");
            setSendText("");
            return;
          }
        } catch {
          // silent
        }
      }

      toast.error(msg);
    } finally {
      setSending(false);
    }
  }, [sendPhone, sendText, apiKey, instanceId, refreshInstanceToken]);

  if (loading) return <WhatsAppSkeleton />;

  if (error) {
    return (
      <div className="p-6 bg-red-50/50 rounded-xl text-center space-y-4">
        <p className="text-red-600">{error.message}</p>
        {error.is401 && (
          <Link
            href={`/${locale}/instances`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Instances
          </Link>
        )}
      </div>
    );
  }

  const normalizedStatus = normalizeStatus(status?.status ?? "");
  const isConnected = normalizedStatus === "connected";
  const displayPhone = status?.phoneNumber || status?.phone;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">{t("connectWhatsApp")}</h3>
          </CardHeader>
          <CardContent className="space-y-6">
            {isConnected ? (
              <div className="flex flex-col items-center justify-center py-10 bg-green-50/50 dark:bg-green-950/10 rounded-lg gap-3">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
                <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                  {t("whatsappConnected")}
                </p>
                {displayPhone && (
                  <p className="text-sm text-muted-foreground font-mono">{displayPhone}</p>
                )}
              </div>
            ) : qr ? (
              <div className="flex justify-center">
                <img
                  src={qr}
                  alt="WhatsApp QR Code"
                  className="w-72 h-72 object-contain border rounded-lg shadow-sm"
                />
              </div>
            ) : (
              <div className="text-center py-10 bg-muted/40 rounded-lg">
                <p className="text-lg font-medium">{t("noQrAvailable")}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("clickConnectToGenerate")}
                </p>
              </div>
            )}

            {!isConnected && (
              <ol className="list-decimal pl-6 space-y-2 text-sm text-muted-foreground">
                <li>{t("openWhatsapp")}</li>
                <li>{t("goToSettings")}</li>
                <li>{t("tapLinkDevice")}</li>
                <li>{t("scanQrCode")}</li>
              </ol>
            )}

            {/* <div className="flex flex-wrap gap-3">
            <Button onClick={handleConnect} disabled={isConnected || connecting}>
              {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("connect")}
            </Button>
            {!isConnected && (
              <Button variant="outline" onClick={handleRefreshQr} disabled={refreshingQr}>
                {refreshingQr ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("refreshQr")}
              </Button>
            )}
          </div> */}
            <div className="flex flex-wrap gap-3">
              {!isConnected && (
                <>
                  <Button className="cursor-pointer" onClick={handleConnect} disabled={connecting}>
                    {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {t("connect")}
                  </Button>

                  <Button className="cursor-pointer" variant="outline" onClick={handleRefreshQr} disabled={refreshingQr}>
                    {refreshingQr ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {t("refreshQr")}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold">{t("connectionStatus")}</h3>
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className="text-sm px-3 py-1"
              >
                {isConnected
                  ? t("connected")
                  : t("disconnected")
                }
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {displayPhone && (
              <p className="text-sm">
                <strong>{t("phone")}</strong> {displayPhone}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="destructive"
                onClick={() => setShowDisconnectDialog(true)}
              // disabled={whatsAppAction === "disconnect"}
              >
                {t("disconnect")}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await restart();
                    toast.success("Restart requested");
                    await fetchData();
                  } catch (e) {
                    toast.error((e as { message?: string })?.message ?? "Failed to restart");
                  }
                }}
              >
                {t("restart")}
              </Button>
              <Button variant="ghost" onClick={() => fetchData()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("refresh")}
              </Button>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h4 className="font-medium">{t("sendMessage")}</h4>
              <div className="space-y-2">
                <Label htmlFor="send-phone">{t("phoneNumber")}</Label>
                <Input
                  id="send-phone"
                  placeholder="+1234567890"
                  value={sendPhone}
                  onChange={(e) => setSendPhone(e.target.value)}
                  disabled={sending}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="send-message">{t("message")}</Label>
                <Textarea
                  id="send-message" placeholder={t("textArea")}
                  value={sendText} onChange={(e) => setSendText(e.target.value)}
                  disabled={sending} rows={3} className="resize-none"
                />
              </div>
              <Button
                onClick={handleSendMessage} disabled={sending || !apiKey}
                className="w-full bg-linear-to-r from-[#A78BFA] to-[#7C3AED] hover:from-[#9F7AEA] hover:to-[#6D28D9] text-white"
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("sending")}</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />{t("send")}</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold">{t("connectionStatus")}</h3>
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className="text-sm px-3 py-1"
              >
                {isConnected ? t("connected") : t("disconnected")}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {displayPhone && (
              <p className="text-sm">
                <strong>{t("phone")}</strong> {displayPhone}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                className="cursor-pointer"
                variant="destructive"
                onClick={() => setShowDisconnectDialog(true)}
              >
                {t("disconnect")}
              </Button>
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={async () => {
                  try {
                    await restart();
                    toast.success(t("restartRequested"));
                    await fetchData();
                  } catch (e) {
                    toast.error((e as { message?: string })?.message ?? t("restartFailed"));
                  }
                }}
              >
                {t("restart")}
              </Button>
              <Button className="cursor-pointer" variant="ghost" onClick={() => fetchData()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("refresh")}
              </Button>
            </div>

            {/* Send Message Section */}
            <div className="border-t pt-6 space-y-4">
              <h4 className="font-medium">{t("sendMessage")}</h4>

              <div className="space-y-4">
                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="send-phone">{t("phoneNumber")}</Label>
                  <Input
                    id="send-phone"
                    placeholder="+1234567890"
                    value={sendPhone}
                    onChange={(e) => setSendPhone(e.target.value)}
                    disabled={sending}
                    className="font-mono"
                  />
                </div>

                {/* Message Text */}
                <div className="space-y-2">
                  <Label htmlFor="send-message">{t("message")}</Label>
                  <Textarea
                    id="send-message"
                    placeholder={t("textArea")}
                    value={sendText}
                    onChange={(e) => setSendText(e.target.value)}
                    disabled={sending}
                    rows={3}
                    className="resize-none"
                  />
                </div>


                {/* Media Attachment Section */}
                

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !apiKey}
                  className="w-full cursor-pointer bg-linear-to-r from-[#A78BFA] to-[#7C3AED] hover:from-[#9F7AEA] hover:to-[#6D28D9] text-white"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("sending")}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {t("send")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmDisconnect")}</DialogTitle>
            <DialogDescription>
              {t("confirmDisconnectDesc")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button
              className="cursor-pointer"
              variant="destructive"
              onClick={async () => {
                setShowDisconnectDialog(false);
                try {
                  await disconnect();
                  toast.success(t("whatsappDisconnected"));
                  await fetchData();
                } catch (e) {
                  toast.error((e as { message?: string })?.message ?? t("disconnectFailed"));
                }
              }}
            >
              {t("disconnect")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}