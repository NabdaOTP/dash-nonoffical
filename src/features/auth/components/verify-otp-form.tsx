"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/features/layout/components/language-switcher";
import { useAuth } from "@/features/auth/context/auth-context";
import { ApiError } from "@/lib/api-client";

export function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth");
  const { verifyOtp } = useAuth();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await verifyOtp({ email, code });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || t("errors.generic"));
      } else {
        setError(t("errors.generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <a
          href="https://www.nabdaotp.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3"
        >
          <div className="h-12 w-12 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Nabda OTP Logo"
              width={50}
              height={50}
            />
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">
            Nabda OTP
          </span>
        </a>
        <div className="flex items-center gap-2">
          {/* <ThemeToggle /> */}
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {t("verifyOtp.title")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("verifyOtp.subtitle", { email })}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="code"
                className="text-sm font-medium text-foreground"
              >
                {t("verifyOtp.code")}
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                placeholder={t("verifyOtp.codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11 bg-background text-center text-lg tracking-widest font-mono"
                maxLength={6}
                required
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full h-11 gradient-primary text-primary-foreground font-medium"
            >
              {loading ? t("verifyOtp.submitting") : t("verifyOtp.submit")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              {t("verifyOtp.backToLogin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
