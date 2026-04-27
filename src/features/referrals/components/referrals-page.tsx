"use client";

import { useState, useEffect } from 'react';
import { ReferralStats } from '../services/referrals-service';
import * as settingsService from "../services/referrals-service";
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/features/auth/context/auth-context';
import { Banknote, Check, Clock, Copy, Gift, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function ReferralsPage() {
    const [copied, setCopied] = useState(false);
    const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
    const [referralLoading, setReferralLoading] = useState(true);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawContact, setWithdrawContact] = useState("");
    const [withdrawLoading, setWithdrawLoading] = useState(false);

    const { user } = useAuth();
    const t = useTranslations("settings");

    const fetchReferralStats = async () => {
        setReferralLoading(true);
        try {
            const data = await settingsService.getReferralStats();
            setReferralStats(data);
        } catch (err) {
            toast.error(t("referral.loadError") || "Failed to load referral data");
        } finally {
            setReferralLoading(false);
        }
    };

    // Load data when component mounts
    useEffect(() => {
        fetchReferralStats();
    }, []);

    const handleCopyCode = async () => {
        const code = referralStats?.referralCode || user?.referralCode || "";
        if (!code) return;
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(withdrawAmount);
        if (!amount || !withdrawContact.trim()) {
            toast.error("Please enter amount and contact details");
            return;
        }

        setWithdrawLoading(true);
        try {
            await settingsService.submitWithdrawal({
                amount,
                contactDetails: withdrawContact.trim()
            });
            toast.success(t("referral.withdrawSuccess") || "Withdrawal request submitted");
            setWithdrawAmount("");
            setWithdrawContact("");
            await fetchReferralStats(); // refresh
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : t("referral.withdrawError"));
        } finally {
            setWithdrawLoading(false);
        }
    };

    const formatDate = (dateStr: string): string => {
        try {
            const d = new Date(dateStr);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        } catch {
            return "—";
        }
    };

    if (referralLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Code + Points */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">{t("referral.title") || "Referral Program"}</h2>
                </div>

                <div className="space-y-2">
                    <Label>{t("referral.yourCode") || "Your Referral Code"}</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            value={referralStats?.referralCode || ""}
                            readOnly
                            className="font-mono tracking-widest bg-muted"
                        />
                        <Button className='cursor-pointer' variant="outline" size="icon" onClick={handleCopyCode}>
                            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-primary/5 rounded-lg p-4">
                    <Banknote className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">{t("referral.totalPoints") || "Total Points"}</p>
                        <p className="text-2xl font-bold text-foreground">{referralStats?.totalPoints || 0}</p>
                    </div>
                </div>
            </div>

            {/* Withdraw Section */}
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="text-lg font-semibold">{t("referral.withdraw") || "Request Withdrawal"}</h2>
                <form onSubmit={handleWithdraw} className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t("referral.amount") || "Amount"}</Label>
                        <Input
                            type="number"
                            min={1}
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="50"
                            disabled={withdrawLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t("referral.contactDetails") || "Contact Details"}</Label>
                        <Input
                            value={withdrawContact}
                            onChange={(e) => setWithdrawContact(e.target.value)}
                            placeholder={t("referral.contactPlaceholder") || "Phone or Email"}
                            disabled={withdrawLoading}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={withdrawLoading || !withdrawAmount || !withdrawContact.trim()}
                        className="gradient-primary text-primary-foreground w-full cursor-pointer"
                    >
                        {withdrawLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {withdrawLoading ? t("referral.submitting") : t("referral.submit")}
                    </Button>
                </form>
            </div>

            {/* History Sections */}
            {referralStats && (
                <>
                    {referralStats.withdrawals.length > 0 && (
                        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                            <h2 className="text-lg font-semibold">{t("referral.withdrawHistory") || "Withdrawal History"}</h2>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {referralStats.withdrawals.map((w) => (
                                        <TableRow key={w.id}>
                                            <TableCell className="font-mono">{w.amount}</TableCell>
                                            <TableCell>{w.contactDetails}</TableCell>
                                            <TableCell><Badge variant="outline">{w.status}</Badge></TableCell>
                                            <TableCell>{formatDate(w.createdAt)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {referralStats.history.length > 0 && (
                        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-lg font-semibold">{t("referral.pointsHistory") || "Points History"}</h2>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Points</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {referralStats.history.map((h) => (
                                        <TableRow key={h.id}>
                                            <TableCell className="font-mono text-success">+{h.points}</TableCell>
                                            <TableCell>{h.description}</TableCell>
                                            <TableCell>{formatDate(h.createdAt)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {referralStats.history.length === 0 && referralStats.withdrawals.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            {t("referral.noActivity") || "No activity yet"}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}