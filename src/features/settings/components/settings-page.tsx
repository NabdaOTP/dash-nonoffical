"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Loader2, CheckCircle, Shield, ShieldOff,
  Copy, Check, Gift, Clock, Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/features/auth/context/auth-context";
import * as settingsService from "../services/settings-service";
import type { ReferralStats } from "../services/settings-service";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch { return "—"; }
}

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const t = useTranslations("settings");

  // Profile
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // 2FA
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaStep, setTwoFaStep] = useState<"idle" | "confirm-enable" | "confirm-disable">("idle");
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaSuccess, setTwoFaSuccess] = useState("");
  const [twoFaError, setTwoFaError] = useState("");

  // Referral
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawContact, setWithdrawContact] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
  if (activeTab === "referral" && !referralStats && !referralLoading) {
    fetchReferralStats();
  }
}, [activeTab, referralStats, referralLoading]);

  const fetchReferralStats = async () => {
    setReferralLoading(true);
    try {
      const data = await settingsService.getReferralStats();
      setReferralStats(data);
    } catch {
      toast.error(t("referral.loadError"));
    } finally {
      setReferralLoading(false);
    }
  };

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
    if (!amount || !withdrawContact.trim()) return;
    setWithdrawLoading(true);
    try {
      await settingsService.submitWithdrawal({ amount, contactDetails: withdrawContact.trim() });
      toast.success(t("referral.withdrawSuccess"));
      setWithdrawAmount("");
      setWithdrawContact("");
      await fetchReferralStats();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("referral.withdrawError"));
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess(false);
    try {
      await settingsService.updateProfile({ name, email, phone });
      await refreshUser();
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : t("profile.title"));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError(t("password.mismatch"));
      return;
    }
    setPasswordSaving(true);
    setPasswordError("");
    setPasswordSuccess(false);
    try {
      await settingsService.changePassword({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Error");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleEnable2fa = async () => {
    setTwoFaLoading(true);
    setTwoFaError("");
    try {
      await settingsService.enable2fa();
      setTwoFaStep("confirm-enable");
    } catch (err) {
      setTwoFaError(err instanceof ApiError ? err.message : "Error");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleConfirm2fa = async () => {
    setTwoFaLoading(true);
    setTwoFaError("");
    try {
      if (twoFaStep === "confirm-enable") {
        await settingsService.confirm2fa(twoFaCode);
        setTwoFaSuccess(t("twoFactor.enableSuccess"));
      } else {
        await settingsService.disable2fa(twoFaCode);
        setTwoFaSuccess(t("twoFactor.disableSuccess"));
      }
      await refreshUser();
      setTwoFaStep("idle");
      setTwoFaCode("");
    } catch (err) {
      setTwoFaError(err instanceof ApiError ? err.message : "Error");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleDisable2fa = async () => {
    setTwoFaLoading(true);
    setTwoFaError("");
    try {
      await settingsService.requestDisable2fa();
      setTwoFaStep("confirm-disable");
    } catch (err) {
      setTwoFaError(err instanceof ApiError ? err.message : "Error");
    } finally {
      setTwoFaLoading(false);
    }
  };

  

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="profile">{t("tabs.profile")}</TabsTrigger>
          <TabsTrigger value="security">{t("tabs.security")}</TabsTrigger>
          <TabsTrigger value="referral">{t("tabs.referral")}</TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("profile.title")}</h2>
            {profileSuccess && (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="h-4 w-4" />{t("profile.success")}
              </div>
            )}
            {profileError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
                {profileError}
              </div>
            )}
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("profile.name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} disabled={profileSaving} />
              </div>
              <div className="space-y-2">
                <Label>{t("profile.email")}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={profileSaving} />
              </div>
              <div className="space-y-2">
                <Label>{t("profile.phone")}</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={profileSaving} />
              </div>
              <Button type="submit" disabled={profileSaving} className="gradient-primary text-primary-foreground cursor-pointer">
                {profileSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {profileSaving ? t("profile.saving") : t("profile.save")}
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* ── Security Tab ── */}
        <TabsContent value="security" className="space-y-6">
          {/* Password */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("password.title")}</h2>
            {passwordSuccess && (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="h-4 w-4" />{t("password.success")}
              </div>
            )}
            {passwordError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
                {passwordError}
              </div>
            )}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("password.current")}</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={passwordSaving} required />
              </div>
              <div className="space-y-2">
                <Label>{t("password.new")}</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} disabled={passwordSaving} required />
                <p className="text-xs text-muted-foreground">{t("password.hint")}</p>
              </div>
              <div className="space-y-2">
                <Label>{t("password.confirm")}</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} disabled={passwordSaving} required />
              </div>
              <Button type="submit" disabled={passwordSaving} className="gradient-primary text-primary-foreground cursor-pointer">
                {passwordSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {passwordSaving ? t("password.saving") : t("password.save")}
              </Button>
            </form>
          </div>

          <Separator />

          {/* 2FA */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("twoFactor.title")}</h2>
            <div className="flex items-center gap-3">
              {user?.twoFactorEnabled ? (
                <><Shield className="h-5 w-5 text-success" /><span className="text-sm text-success font-medium">{t("twoFactor.enabled")}</span></>
              ) : (
                <><ShieldOff className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{t("twoFactor.disabled")}</span></>
              )}
            </div>
            {twoFaSuccess && (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="h-4 w-4" />{twoFaSuccess}
              </div>
            )}
            {twoFaError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
                {twoFaError}
              </div>
            )}
            {twoFaStep !== "idle" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("twoFactor.confirmCode")}</p>
                <div className="space-y-2">
                  <Label>{t("twoFactor.code")}</Label>
                  <Input value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value)} maxLength={6} className="text-center tracking-widest font-mono" disabled={twoFaLoading} />
                </div>
                <Button onClick={handleConfirm2fa} disabled={twoFaLoading || twoFaCode.length < 6} className="gradient-primary text-primary-foreground cursor-pointer">
                  {twoFaLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {twoFaLoading ? t("twoFactor.confirming") : t("twoFactor.confirm")}
                </Button>
              </div>
            ) : user?.twoFactorEnabled ? (
              <Button variant="outline" onClick={handleDisable2fa} disabled={twoFaLoading} className="text-destructive border-destructive/20 cursor-pointer">
                {twoFaLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("twoFactor.disable")}
              </Button>
            ) : (
              <Button onClick={handleEnable2fa} disabled={twoFaLoading} className="gradient-primary text-primary-foreground cursor-pointer">
                {twoFaLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("twoFactor.enable")}
              </Button>
            )}
          </div>
        </TabsContent>

        {/*  Referral Tab  */}
        <TabsContent value="referral" className="space-y-6">
          {referralLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {referralStats && (
            <>
              {/* Code + Points */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">{t("referral.title")}</h2>
                </div>

                <div className="space-y-2">
                  <Label>{t("referral.yourCode")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={referralStats.referralCode}
                      readOnly
                      className="font-mono tracking-widest bg-muted"
                    />
                    <Button variant="outline" size="icon" onClick={handleCopyCode} className="cursor-pointer">
                      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-primary/5 rounded-lg p-4">
                  <Banknote className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("referral.totalPoints")}</p>
                    <p className="text-2xl font-bold text-foreground">{referralStats.totalPoints}</p>
                  </div>
                </div>
              </div>

              {/* Withdraw */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="text-lg font-semibold">{t("referral.withdraw")}</h2>
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("referral.amount")}</Label>
                    <Input
                      type="number" min={1}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="50"
                      disabled={withdrawLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("referral.contactDetails")}</Label>
                    <Input
                      value={withdrawContact}
                      onChange={(e) => setWithdrawContact(e.target.value)}
                      placeholder={t("referral.contactPlaceholder")}
                      disabled={withdrawLoading}
                    />
                  </div>
                  <Button type="submit" disabled={withdrawLoading || !withdrawAmount || !withdrawContact.trim()} className="gradient-primary text-primary-foreground cursor-pointer">
                    {withdrawLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {withdrawLoading ? t("referral.submitting") : t("referral.submit")}
                  </Button>
                </form>
              </div>

              {/* Withdrawals History */}
              {referralStats.withdrawals.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                  <h2 className="text-lg font-semibold">{t("referral.withdrawHistory")}</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("referral.amount")}</TableHead>
                        <TableHead>{t("referral.contact")}</TableHead>
                        <TableHead>{t("referral.status")}</TableHead>
                        <TableHead>{t("referral.date")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referralStats.withdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-mono">{w.amount}</TableCell>
                          <TableCell>{w.contactDetails}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{w.status}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(w.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Points History */}
              {referralStats.history.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">{t("referral.pointsHistory")}</h2>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("referral.points")}</TableHead>
                        <TableHead>{t("referral.description")}</TableHead>
                        <TableHead>{t("referral.date")}</TableHead>
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
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t("referral.noActivity")}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}