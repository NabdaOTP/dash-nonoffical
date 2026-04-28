"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    getAdminPlans, createAdminPlan, updateAdminPlan, deleteAdminPlan,
} from "@/features/admin/services/admin-service";
import type { AdminPlan } from "@/features/admin/types";
import { Loader2, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

type DialogMode = "create" | "edit" | "delete" | null;

const emptyForm = (): Partial<AdminPlan> => ({
    name: "",
    code: "",
    description: "",
    badgeText: "",
    interval: "MONTHLY",
    priceUsd: 0,
    freeTrialDays: 5,
    features: [],
    isFeatured: false,
});

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<AdminPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<DialogMode>(null);
    const [selected, setSelected] = useState<AdminPlan | null>(null);
    const [form, setForm] = useState<Partial<AdminPlan>>(emptyForm());
    const [featuresText, setFeaturesText] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAdminPlans();
            setPlans(Array.isArray(data) ? data : []);
        } catch {
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPlans(); }, [fetchPlans]);

    const openCreate = () => {
        setForm(emptyForm());
        setFeaturesText("");
        setSelected(null);
        setMode("create");
    };

    const openEdit = (plan: AdminPlan) => {
        setSelected(plan);
        setForm({ ...plan });
        setFeaturesText((plan.features ?? []).join("\n"));
        setMode("edit");
    };

    const openDelete = (plan: AdminPlan) => {
        setSelected(plan);
        setMode("delete");
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const features = featuresText.split("\n").map((f) => f.trim()).filter(Boolean);
            const payload = { ...form, features };

            if (mode === "create") {
                await createAdminPlan(payload);
                toast.success("Plan created");
            } else if (mode === "edit" && selected) {
                await updateAdminPlan(selected.id, payload);
                toast.success("Plan updated");
            }
            setMode(null);
            await fetchPlans();
        } catch (err: unknown) {
            toast.error((err as { message?: string })?.message ?? "Failed to save plan");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await deleteAdminPlan(selected.id);
            toast.success("Plan deleted");
            setMode(null);
            await fetchPlans();
        } catch (err: unknown) {
            toast.error((err as { message?: string })?.message ?? "Failed to delete plan");
        } finally {
            setSaving(false);
        }
    };

    const updateForm = (key: keyof AdminPlan, value: unknown) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Plans</h1>
                    <p className="text-sm text-muted-foreground mt-1">{plans.length} plans</p>
                </div>
                <Button onClick={openCreate} className="gradient-primary text-primary-foreground gap-2">
                    <Plus className="h-4 w-4" />
                    New Plan
                </Button>
            </div>

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
                                    <TableHead>Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Interval</TableHead>
                                    <TableHead>Trial Days</TableHead>
                                    <TableHead>Featured</TableHead>
                                    <TableHead>Features</TableHead>
                                    <TableHead className="text-end">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                            No plans found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    plans.map((plan) => (
                                        <TableRow key={plan.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{plan.name}</p>
                                                    {plan.badgeText && (
                                                        <span className="text-xs text-muted-foreground">{plan.badgeText}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs font-mono">{plan.code}</Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold text-sm">
                                                ${plan.priceUsd ?? plan.price}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-xs ${plan.interval === "YEARLY" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                                                    {plan.interval}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {plan.freeTrialDays ?? "—"} days
                                            </TableCell>
                                            <TableCell>
                                                {plan.isFeatured
                                                    ? <Check className="h-4 w-4 text-green-600" />
                                                    : <X className="h-4 w-4 text-muted-foreground" />}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {(plan.features ?? []).length} features
                                            </TableCell>
                                            <TableCell className="text-end">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(plan)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDelete(plan)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* create / edit dialog */}
            <Dialog open={mode === "create" || mode === "edit"} onOpenChange={() => setMode(null)}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{mode === "create" ? "New Plan" : "Edit Plan"}</DialogTitle>
                        <DialogDescription>
                            {mode === "create" ? "Create a new subscription plan." : `Editing: ${selected?.name}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={form.name ?? ""} onChange={(e) => updateForm("name", e.target.value)} disabled={saving} />
                            </div>
                            <div className="space-y-2">
                                <Label>Code</Label>
                                <Input value={form.code ?? ""} onChange={(e) => updateForm("code", e.target.value)} disabled={saving} placeholder="PLAN_CODE" className="font-mono" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={form.description ?? ""} onChange={(e) => updateForm("description", e.target.value)} disabled={saving} />
                        </div>

                        <div className="space-y-2">
                            <Label>Badge Text</Label>
                            <Input value={form.badgeText ?? ""} onChange={(e) => updateForm("badgeText", e.target.value)} disabled={saving} placeholder="e.g. BEST VALUE" />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Price (USD)</Label>
                                <Input type="number" value={form.priceUsd ?? 0} onChange={(e) => updateForm("priceUsd", Number(e.target.value))} disabled={saving} />
                            </div>
                            <div className="space-y-2">
                                <Label>Interval</Label>
                                <Select value={form.interval ?? "MONTHLY"} onValueChange={(v) => updateForm("interval", v)} disabled={saving}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MONTHLY">MONTHLY</SelectItem>
                                        <SelectItem value="YEARLY">YEARLY</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Trial Days</Label>
                                <Input type="number" value={form.freeTrialDays ?? 0} onChange={(e) => updateForm("freeTrialDays", Number(e.target.value))} disabled={saving} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch
                                checked={form.isFeatured ?? false}
                                onCheckedChange={(v) => updateForm("isFeatured", v)}
                                disabled={saving}
                            />
                            <Label>Featured plan</Label>
                        </div>

                        <div className="space-y-2">
                            <Label>Features <span className="text-xs text-muted-foreground">(one per line)</span></Label>
                            <Textarea
                                value={featuresText}
                                onChange={(e) => setFeaturesText(e.target.value)}
                                disabled={saving}
                                rows={5}
                                placeholder={"Unlimited Messages\nNo Per-Message Fee\nAPI Access"}
                                className="resize-none font-mono text-sm"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMode(null)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving || !form.name?.trim()} className="gradient-primary text-primary-foreground">
                            {saving && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                            {mode === "create" ? "Create" : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* delete confirm */}
            <Dialog open={mode === "delete"} onOpenChange={() => setMode(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Plan</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.
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