"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    getAdminProxies, getAdminProxyStats, createAdminProxy, updateAdminProxy, deleteAdminProxy,
} from "@/features/admin/services/admin-service";
import type { AdminProxy, AdminProxyStats } from "@/features/admin/types";
import {
    Loader2, Plus, Pencil, Trash2, MoreHorizontal, Server, Wifi, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";

type DialogMode = "create" | "edit" | "delete" | "sessions" | null;

const emptyForm = (): Partial<AdminProxy> => ({
    host: "",
    port: 3000,
    username: "",
    password: "",
    type: "http",
    isActive: true,
    maxSessions: 100,
});

export default function AdminProxiesPage() {
    const [proxies, setProxies] = useState<AdminProxy[]>([]);
    const [stats, setStats] = useState<AdminProxyStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<DialogMode>(null);
    const [selected, setSelected] = useState<AdminProxy | null>(null);
    const [form, setForm] = useState<Partial<AdminProxy>>(emptyForm());
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [proxiesData, statsData] = await Promise.allSettled([
                getAdminProxies(),
                getAdminProxyStats(),
            ]);
            if (proxiesData.status === "fulfilled") {
                setProxies(Array.isArray(proxiesData.value) ? proxiesData.value : []);
            }
            if (statsData.status === "fulfilled") {
                setStats(Array.isArray(statsData.value) ? statsData.value as AdminProxyStats[] : []);
            }
        } catch {
            toast.error("Failed to load proxies");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const getStats = (proxyId: string): AdminProxyStats | undefined =>
        stats.find((s) => s.id === proxyId);

    const openCreate = () => {
        setForm(emptyForm());
        setSelected(null);
        setMode("create");
    };

    const openEdit = (proxy: AdminProxy) => {
        setSelected(proxy);
        setForm({ ...proxy });
        setMode("edit");
    };

    const openDelete = (proxy: AdminProxy) => {
        setSelected(proxy);
        setMode("delete");
    };

    const openSessions = (proxy: AdminProxy) => {
        setSelected(proxy);
        setMode("sessions");
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (mode === "create") {
                await createAdminProxy(form);
                toast.success("Proxy created");
            } else if (mode === "edit" && selected) {
                await updateAdminProxy(selected.id, form);
                toast.success("Proxy updated");
            }
            setMode(null);
            setForm(emptyForm());
            setSelected(null);
            await fetchAll();
        } catch (err: unknown) {
            toast.error((err as { message?: string })?.message ?? "Failed to save proxy");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await deleteAdminProxy(selected.id);
            toast.success("Proxy deleted");
            setMode(null);
            await fetchAll();
        } catch (err: unknown) {
            toast.error((err as { message?: string })?.message ?? "Failed to delete proxy");
        } finally {
            setSaving(false);
        }
    };

    const updateForm = (key: keyof AdminProxy, value: unknown) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const sessionStatusStyles: Record<string, string> = {
        CONNECTED: "bg-green-100 text-green-700 border-green-200",
        CONNECTING: "bg-blue-100 text-blue-700 border-blue-200",
        DISCONNECTED: "bg-gray-100 text-gray-600 border-gray-200",
        RECONNECTING: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Proxies</h1>
                    <p className="text-sm text-muted-foreground mt-1">{proxies.length} proxies</p>
                </div>
                <Button onClick={openCreate} className="gradient-primary text-primary-foreground gap-2">
                    <Plus className="h-4 w-4" />
                    New Proxy
                </Button>
            </div>

            {/* Stats Cards */}
            {stats.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {stats.map((s) => {
                        const pct = s.maxSessions > 0 ? Math.round((s.activeSessions / s.maxSessions) * 100) : 0;
                        const color = pct > 80 ? "text-red-600" : pct > 50 ? "text-yellow-600" : "text-green-600";
                        return (
                            <div key={s.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Server className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium truncate">{s.host}:{s.port}</span>
                                    </div>
                                    <Badge variant="outline" className={`text-xs ${s.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                                        {s.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Sessions</span>
                                        <span className={`font-semibold ${color}`}>
                                            {s.activeSessions} / {s.maxSessions.toLocaleString()}
                                        </span>
                                    </div>
                                    <Progress value={pct} className="h-2" />
                                    <p className="text-xs text-muted-foreground text-right">{pct}% capacity</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
                                    <TableHead>Host</TableHead>
                                    <TableHead>Port</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Sessions</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead className="text-end">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proxies.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                            No proxies found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    proxies.map((proxy, index) => {
                                        const s = getStats(proxy.id);
                                        const activeSessions = s?.activeSessions ?? (proxy.sessions?.length ?? 0);
                                        const maxSessions = proxy.maxSessions ?? s?.maxSessions ?? 0;
                                        const pct = maxSessions > 0 ? Math.round((activeSessions / maxSessions) * 100) : 0;

                                        return (
                                            <TableRow key={proxy.id}>
                                                <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                                                <TableCell className="font-mono text-sm font-medium">{proxy.host}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{proxy.port}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs uppercase">{proxy.type ?? "http"}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`text-xs ${proxy.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                                                        {proxy.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <button
                                                        onClick={() => openSessions(proxy)}
                                                        className="text-primary hover:underline font-medium"
                                                    >
                                                        {activeSessions} sessions
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 min-w-24">
                                                        <Progress value={pct} className="h-1.5 flex-1" />
                                                        <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-end">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openSessions(proxy)}>
                                                                <Wifi className="h-4 w-4 me-2" />
                                                                View Sessions
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openEdit(proxy)}>
                                                                <Pencil className="h-4 w-4 me-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => openDelete(proxy)}
                                                            >
                                                                <Trash2 className="h-4 w-4 me-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={mode === "create" || mode === "edit"} onOpenChange={() => setMode(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{mode === "create" ? "New Proxy" : "Edit Proxy"}</DialogTitle>
                        <DialogDescription>
                            {mode === "create" ? "Add a new proxy server." : `Editing: ${selected?.host}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label>Host</Label>
                                <Input value={form.host ?? ""} onChange={(e) => updateForm("host", e.target.value)} disabled={saving} placeholder="proxy.example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label>Port</Label>
                                <Input type="number" value={form.port ?? 3000} onChange={(e) => updateForm("port", Number(e.target.value))} disabled={saving} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input value={form.username ?? ""} onChange={(e) => updateForm("username", e.target.value)} disabled={saving} />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={form.password ?? ""}
                                        onChange={(e) => updateForm("password", e.target.value)}
                                        disabled={saving}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Max Sessions</Label>
                                <Input type="number" value={form.maxSessions ?? 100} onChange={(e) => updateForm("maxSessions", Number(e.target.value))} disabled={saving} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMode(null)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving || !form.host?.trim()} className="gradient-primary text-primary-foreground">
                            {saving && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                            {mode === "create" ? "Create" : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Sessions Dialog */}
            <Dialog open={mode === "sessions"} onOpenChange={() => setMode(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Sessions — {selected?.host}</DialogTitle>
                        <DialogDescription>{selected?.sessions?.length ?? 0} sessions</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        {(selected?.sessions ?? []).length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No sessions</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Instance ID</TableHead>
                                        <TableHead>Last Connected</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(selected?.sessions ?? []).map((session) => (
                                        <TableRow key={session.id}>
                                            <TableCell className="font-mono text-xs">{session.phoneNumber}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-xs ${sessionStatusStyles[session.status] ?? "bg-muted text-muted-foreground"}`}>
                                                    {session.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-muted-foreground">
                                                {session.instanceId?.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {session.lastConnectedAt
                                                    ? new Date(session.lastConnectedAt).toLocaleDateString()
                                                    : "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            {/* Delete Confirm */}
            <Dialog open={mode === "delete"} onOpenChange={() => setMode(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Proxy</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selected?.host}</strong>? All sessions will be disconnected.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMode(null)} disabled={saving}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}