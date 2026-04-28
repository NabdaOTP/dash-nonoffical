// app/[locale]/login/page.tsx
import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginForm />;
}