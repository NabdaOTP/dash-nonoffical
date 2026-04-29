"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    setNewLimit,
    setWarmLimit,
    setTrustedLimit,
    softBan,
    reconnect,
    getProtection,
} from "@/features/admin/services/admin-service";
import {
    Shield,
    Loader2,
    Ban,
    RefreshCw,
    Users,
    Flame,
    Star,
} from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminProtectionPage() {
    // Rate Limits
    const [newLimit, setNewLimitState] = useState({ perMin: 10, perHour: 100 });
    const [warmLimit, setWarmLimitState] = useState({ perMin: 30, perHour: 300 });
    const [trustedLimit, setTrustedLimitState] = useState({
        perMin: 60,
        perHour: 600,
    });

    // Soft Ban
    const [banSeconds, setBanSeconds] = useState(60);

    // Reconnect
    const [reconnectSettings, setReconnectSettings] = useState({
        baseMs: 500,
        maxMs: 5000,
    });

    // Loading states
    const [loading, setLoading] = useState<string | null>(null);

    // Confirmation Dialog State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState("");
    const [confirmDescription, setConfirmDescription] = useState("");
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [isDestructive, setIsDestructive] = useState(false);

    const handleSetLimit = async (
        type: "new" | "warm" | "trusted",
        values: { perMin: number; perHour: number },
    ) => {
        setLoading(type);
        try {
            if (type === "new") await setNewLimit(values);
            else if (type === "warm") await setWarmLimit(values);
            else await setTrustedLimit(values);
            toast.success(
                `${type.charAt(0).toUpperCase() + type.slice(1)} limits updated`,
            );
        } catch (err: unknown) {
            toast.error(
                (err as { message?: string })?.message ?? "Failed to update limits",
            );
        } finally {
            setLoading(null);
        }
    };

    const handleSoftBan = async () => {
        setLoading("ban");
        try {
            await softBan({ seconds: banSeconds });
            toast.success(`Soft ban applied for ${banSeconds} seconds`);
        } catch (err: unknown) {
            toast.error(
                (err as { message?: string })?.message ?? "Failed to apply soft ban",
            );
        } finally {
            setLoading(null);
        }
    };

    const handleReconnect = async () => {
        setLoading("reconnect");
        try {
            await reconnect(reconnectSettings);
            toast.success("Reconnect settings updated");
        } catch (err: unknown) {
            toast.error(
                (err as { message?: string })?.message ??
                "Failed to update reconnect settings",
            );
        } finally {
            setLoading(null);
        }
    };

    const showConfirmation = (
        title: string,
        description: string,
        action: () => void,
        destructive: boolean = false
    ) => {
        setConfirmTitle(title);
        setConfirmDescription(description);
        setConfirmAction(() => action);
        setIsDestructive(destructive);
        setConfirmOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Protection</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage rate limits and connection protection settings
                    </p>
                </div>
            </div>

            {/* Rate Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* New Accounts */}
                <Card className="border border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <CardTitle className="text-base">New Accounts</CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            Rate limits for newly created instances
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Per Minute</Label>
                                <Input
                                    type="number"
                                    value={newLimit.perMin}
                                    onChange={(e) =>
                                        setNewLimitState((p) => ({
                                            ...p,
                                            perMin: Number(e.target.value),
                                        }))
                                    }
                                    min={1}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Per Hour</Label>
                                <Input
                                    type="number"
                                    value={newLimit.perHour}
                                    onChange={(e) =>
                                        setNewLimitState((p) => ({
                                            ...p,
                                            perHour: Number(e.target.value),
                                        }))
                                    }
                                    min={1}
                                />
                            </div>
                        </div>
                        <Button
                            className="w-full"
                            size="sm"
                            onClick={() =>
                                showConfirmation(
                                    "Update New Accounts Limits",
                                    `The following limits will be applied:\n• ${newLimit.perMin} requests/minute\n• ${newLimit.perHour} requests/hour\n\nThis change will affect all newly created accounts immediately.`,
                                    () => handleSetLimit("new", newLimit)
                                )
                            }
                            disabled={loading === "new"}
                        >
                            {loading === "new" ? (
                                <Loader2 className="h-4 w-4 animate-spin me-2" />
                            ) : null}
                            Apply
                        </Button>
                    </CardContent>
                </Card>

                {/* warm accounts */}
                <Card className="border border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <CardTitle className="text-base">Warm Accounts</CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            Rate limits for warming up instances
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Per Minute</Label>
                                <Input
                                    type="number"
                                    value={warmLimit.perMin}
                                    onChange={(e) =>
                                        setWarmLimitState((p) => ({
                                            ...p,
                                            perMin: Number(e.target.value),
                                        }))
                                    }
                                    min={1}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Per Hour</Label>
                                <Input
                                    type="number"
                                    value={warmLimit.perHour}
                                    onChange={(e) =>
                                        setWarmLimitState((p) => ({
                                            ...p,
                                            perHour: Number(e.target.value),
                                        }))
                                    }
                                    min={1}
                                />
                            </div>
                        </div>
                        <Button
                            className="w-full"
                            size="sm"
                            onClick={() =>
                                showConfirmation(
                                    "Update Warm Accounts Limits",
                                    `The following limits will be applied:\n• ${warmLimit.perMin} requests/minute\n• ${warmLimit.perHour} requests/hour\n\nThis change will affect all warming-up accounts.`,
                                    () => handleSetLimit("warm", warmLimit)
                                )
                            }
                            disabled={loading === "warm"}
                        >
                            {loading === "warm" ? (
                                <Loader2 className="h-4 w-4 animate-spin me-2" />
                            ) : null}
                            Apply
                        </Button>
                    </CardContent>
                </Card>

                {/* Trusted Accounts */}
                <Card className="border border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-green-500" />
                            <CardTitle className="text-base">Trusted Accounts</CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            Rate limits for trusted instances
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Per Minute</Label>
                                <Input
                                    type="number"
                                    value={trustedLimit.perMin}
                                    onChange={(e) =>
                                        setTrustedLimitState((p) => ({
                                            ...p,
                                            perMin: Number(e.target.value),
                                        }))
                                    }
                                    min={1}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Per Hour</Label>
                                <Input
                                    type="number"
                                    value={trustedLimit.perHour}
                                    onChange={(e) =>
                                        setTrustedLimitState((p) => ({
                                            ...p,
                                            perHour: Number(e.target.value),
                                        }))
                                    }
                                    min={1}
                                />
                            </div>
                        </div>
                        <Button
                            className="w-full"
                            size="sm"
                            onClick={() =>
                                showConfirmation(
                                    "Update Trusted Accounts Limits",
                                    `The following limits will be applied:\n• ${trustedLimit.perMin} requests/minute\n• ${trustedLimit.perHour} requests/hour\n\nThis change will affect all trusted accounts.`,
                                    () => handleSetLimit("trusted", trustedLimit)
                                )
                            }
                            disabled={loading === "trusted"}
                        >
                            {loading === "trusted" ? (
                                <Loader2 className="h-4 w-4 animate-spin me-2" />
                            ) : null}
                            Apply
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Soft Ban + Reconnect */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Soft Ban */}
                <Card className="border border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Ban className="h-4 w-4 text-red-500" />
                            <CardTitle className="text-base">Soft Ban</CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            Temporarily ban all instances for a specified duration
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Duration (seconds)</Label>
                            <Input
                                type="number"
                                value={banSeconds}
                                onChange={(e) => setBanSeconds(Number(e.target.value))}
                                min={1}
                                placeholder="e.g. 60"
                            />
                            <p className="text-xs text-muted-foreground">
                                {banSeconds >= 3600
                                    ? `${(banSeconds / 3600).toFixed(1)} hours`
                                    : banSeconds >= 60
                                        ? `${Math.floor(banSeconds / 60)} minutes ${banSeconds % 60}s`
                                        : `${banSeconds} seconds`}
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full"
                            size="sm"
                            onClick={() =>
                                showConfirmation(
                                    "Apply Soft Ban",
                                    `All instances will be temporarily banned for ${banSeconds} seconds.\n\nThis is a powerful action that will affect ALL users. Are you sure you want to proceed?`,
                                    handleSoftBan,
                                    true   // destructive
                                )
                            }
                            disabled={loading === "ban"}
                        >
                            {loading === "ban" ? (
                                <Loader2 className="h-4 w-4 animate-spin me-2" />
                            ) : (
                                <Ban className="h-4 w-4 me-2" />
                            )}
                            Apply Soft Ban
                        </Button>
                    </CardContent>
                </Card>

                {/* Reconnect */}
                <Card className="border border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-violet-500" />
                            <CardTitle className="text-base">Reconnect Settings</CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            Configure reconnection delay for WhatsApp sessions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Base Delay (ms)</Label>
                                <Input
                                    type="number"
                                    value={reconnectSettings.baseMs}
                                    onChange={(e) =>
                                        setReconnectSettings((p) => ({
                                            ...p,
                                            baseMs: Number(e.target.value),
                                        }))
                                    }
                                    min={100}
                                    placeholder="500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Max Delay (ms)</Label>
                                <Input
                                    type="number"
                                    value={reconnectSettings.maxMs}
                                    onChange={(e) =>
                                        setReconnectSettings((p) => ({
                                            ...p,
                                            maxMs: Number(e.target.value),
                                        }))
                                    }
                                    min={100}
                                    placeholder="5000"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Reconnect will retry between {reconnectSettings.baseMs}ms and{" "}
                            {reconnectSettings.maxMs}ms
                        </p>
                        <Button
                            className="w-full gradient-primary text-primary-foreground"
                            size="sm"
                            onClick={() =>
                                showConfirmation(
                                    "Update Reconnect Settings",
                                    `Reconnection delay will be changed to:\n• Base: ${reconnectSettings.baseMs}ms\n• Max: ${reconnectSettings.maxMs}ms\n\nThis will affect all WhatsApp sessions.`,
                                    handleReconnect
                                )
                            }
                            disabled={loading === "reconnect"}
                        >
                            {loading === "reconnect" ? (
                                <Loader2 className="h-4 w-4 animate-spin me-2" />
                            ) : (
                                <RefreshCw className="h-4 w-4 me-2" />
                            )}
                            Update Settings
                        </Button>
                    </CardContent>
                </Card>
            </div>
            {/* confirmation dialog  */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="max-w-md sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm whitespace-pre-line">
                            {confirmDescription}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant={isDestructive ? "destructive" : "default"}
                            onClick={async () => {
                                if (confirmAction) {
                                    confirmAction();
                                }
                                setConfirmOpen(false);
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
