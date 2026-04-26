"use client";

import { useTranslations } from "next-intl";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function ContactPage() {
  const t = useTranslations("contact");

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-12">
        {/* Header Section */}
        {/* <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-block">
            <div className="h-16 w-16 rounded-full bg-linear-to-br from-success/20 to-success/5 flex items-center justify-center mx-auto">
              <MessageCircle className="h-8 w-8 text-success" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-3">
              {t("title")}
            </h1>
            <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div> */}

        {/* Main Card */}
        <div className="bg-card rounded-2xl border border-border p-8 md:p-12 shadow-card hover:shadow-elevated transition-shadow duration-300 space-y-8">
          <div className="text-center space-y-4">
            <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto">
              <Image
                src="/whatsapp.svg"
                alt="whatsapp icon"
                width={54}
                height={54}
              />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">
                {t("whatsapp")}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                {t("whatsappDesc")}
              </p>
            </div>
          </div>

          {/* Phone Number Display */}
          <div className="bg-muted/30 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Support Number</p>
            <p
              dir="ltr"
              className="text-3xl font-bold text-foreground tracking-tight font-mono"
            >
              +90 534 663 91 45
            </p>
          </div>

          {/* CTA Button */}
          <a
            href="https://wa.me/905346639145"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full h-12 bg-linear-to-r from-success to-success/90 hover:from-success/90 hover:to-success text-white font-semibold text-base gap-2 transition-all duration-300 group cursor-pointer">
              <MessageCircle className="h-5 w-5" />
              {t("whatsappCTA")}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </a>

          {/* Additional Info */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              {t("availableBadge")}
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center space-y-4 text-sm text-muted-foreground">
          <p>{t("footerMessage")}</p>
        </div>
      </div>
    </div>
  );
}
