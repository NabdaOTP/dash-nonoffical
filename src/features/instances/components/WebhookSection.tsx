"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { configureWebhook } from "@/features/instances/services/instances-service";
import { Loader2, Webhook, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface WebhookSectionProps {
    webhookUrl: string | null;
    webhookEnabled: boolean;
}

const WEBHOOK_EVENTS = [
    { name: "message.sent", desc: "Triggered after a message is sent to WhatsApp" },
    { name: "message.received", desc: "Triggered when an incoming message is received" },
    { name: "message.ack", desc: "Triggered when message delivery status changes" },
];

// const WEBHOOK_EVENTS = [
//   { name: "message.sent", descKey: "messageSentDesc" },
//   { name: "message.received", descKey: "messageReceivedDesc" },
//   { name: "message.ack", descKey: "messageAckDesc" },
// ];

export function WebhookSection({ webhookUrl, webhookEnabled }: WebhookSectionProps) {
    const [url, setUrl] = useState(webhookUrl ?? "");
    const [enabled, setEnabled] = useState(webhookEnabled);
    const [saving, setSaving] = useState(false);
    const t = useTranslations("instances");

    useEffect(() => {
        setUrl(webhookUrl ?? "");
        setEnabled(webhookEnabled);
    }, [webhookUrl, webhookEnabled]);

    const handleSave = async () => {
        if (enabled && !url.trim()) {
            toast.error(t("pleaseEnterUrl"));
            return;
        }
        if (enabled && !url.startsWith("https://")) {
            toast.error(t("urlMustStartWithHttps"));
            return;
        }
        setSaving(true);
        try {
            await configureWebhook({ webhookUrl: url.trim(), webhookEnabled: enabled });
            toast.success(t("webhookSaved"));
        } catch (err: unknown) {
            toast.error((err as { message?: string })?.message ?? t("webhookSaveFailed"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="mt-6 overflow-hidden border border-border shadow-sm">
            <CardHeader className="bg-muted/30 py-4 pt-6">
                <div className="flex items-center gap-2">
                    <Webhook className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-semibold">{t("webhookConfiguration")}</CardTitle>
                    <Badge
                        variant="outline"
                        className={`ms-auto text-xs ${enabled ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}`}
                    >
                        {enabled ? t("enabled") : t("disabled")}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

                {/* Enable toggle */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="font-medium text-sm">{t("enableWebhook")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {t("enableWebhookDesc")}
                        </p>
                    </div>
                    <Switch
                        className="cursor-pointer"
                        checked={enabled}
                        onCheckedChange={setEnabled}
                        disabled={saving}
                    />
                </div>

                {/* URL input */}
                <div className="space-y-2">
                    <Label htmlFor="webhook-url" className="text-sm">{t("webhookUrl")}</Label>
                    <Input
                        id="webhook-url"
                        type="url"
                        placeholder={t("webhookUrlPlaceholder")}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={saving || !enabled}
                        className={!enabled ? "opacity-50" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t("webhookUrlDesc")}
                    </p>
                </div>

                {/* Events */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">{t("events")}</p>
                    <div className="rounded-lg border border-border overflow-hidden">
                        {WEBHOOK_EVENTS.map((event, i) => (
                            <div
                                key={event.name}
                                className={`flex items-start gap-3 px-4 py-3 ${i < WEBHOOK_EVENTS.length - 1 ? "border-b border-border" : ""}`}
                            >
                                <Badge variant="outline" className="text-xs font-mono shrink-0 mt-0.5">
                                    {event.name}
                                </Badge>
                                <p className="text-xs text-muted-foreground">{event.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payload example */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">{t("payloadExample")}</p>
                    <pre className="bg-muted/50 rounded-lg p-4 text-xs font-mono overflow-x-auto text-muted-foreground">
                        {`{
  "instanceId": "uuid",
  "event": "message.sent",
  "payload": {
    "messageId": "uuid",
    "status": "SENT",
    "phone": "+1234567890",
    "message": "Your OTP is 123456"
  },
  "timestamp": "2026-01-01T00:00:00.000Z"
}`}
                    </pre>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full gradient-primary text-primary-foreground cursor-pointer"
                >
                    {saving ? (
                        <><Loader2 className="h-4 w-4 me-2 animate-spin" />{t("saving")}</>
                    ) : (
                        <><Webhook className="h-4 w-4 me-2" />{t("saveWebhookSettings")}</>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}