"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CreditCard,
  FileText,
  Loader2,
  Download,
  ExternalLink,
  CheckCircle2,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import * as billingService from "../services/billing-service";
import type { Plan, Invoice } from "../types";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return "—"; }
}

function getInvoiceAmount(inv: Invoice): string {
  if (inv.totalAmountUsd) return `$${parseFloat(inv.totalAmountUsd).toFixed(2)}`;
  if (inv.amount != null) return `${inv.currency?.toUpperCase() ?? ""} ${inv.amount}`;
  return "—";
}

function getInvoicePdf(inv: Invoice): string | undefined {
  return inv.invoicePdf || inv.pdfUrl;
}

export function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Awaited<ReturnType<typeof billingService.getCurrentSubscription>>>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get("payment") === "success";
  const successPlanId = searchParams.get("planId");
  const t = useTranslations("billing");

  useEffect(() => {
    async function fetchData() {
      try {
        const [plansData, invoicesData, subscriptionData] = await Promise.allSettled([
          billingService.getPlans(),
          billingService.getInvoices(),
          billingService.getCurrentSubscription(),
        ]);
        if (plansData.status === "fulfilled") setPlans(plansData.value);
        if (invoicesData.status === "fulfilled") {
          setInvoices(Array.isArray(invoicesData.value) ? invoicesData.value : []);
        }
        if (subscriptionData.status === "fulfilled") setCurrentSubscription(subscriptionData.value);
      } catch {
        // handled by API client
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const successPlan = successPlanId && plans.length > 0 ? plans.find((p) => p.id === successPlanId) : null;
  const displayPlan = currentSubscription?.plan ?? successPlan;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Payment success banner */}
      {paymentSuccess && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-success/20 p-2 shrink-0">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{t("checkout.success")}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t("checkout.successDesc")}</p>
              {successPlan && (
                <div className="mt-3 text-sm">
                  <p className="font-medium text-foreground">{successPlan.name}</p>
                  <p className="text-muted-foreground">
                    {successPlan.price != null && successPlan.price > 0
                      ? `$${successPlan.price}/month`
                      : t("plans.free")}
                  </p>
                </div>
              )}
            </div>
          </div>
          <Button asChild className="gradient-primary text-primary-foreground shrink-0">
            <Link href="/instances">
              <Server className="h-4 w-4 me-2" />
              Go to Instances
            </Link>
          </Button>
        </div>
      )}

      {/* Current Plan */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#A78BFA]" />
          {t("plans.current")}
        </h2>
        {displayPlan ? (
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground text-lg">{displayPlan.name}</h3>
                <p className="text-2xl font-bold text-[#7C3AED] mt-1">
                  {displayPlan.price != null
                    ? displayPlan.price > 0 ? `$${displayPlan.price}` : t("plans.free")
                    : "—"}
                </p>
              </div>
              {paymentSuccess && (
                <Badge className="bg-success/10 text-success border-success/20 shrink-0">
                  <CheckCircle2 className="h-3 w-3 me-1" />
                  Active
                </Badge>
              )}
            </div>
            {displayPlan.features && displayPlan.features.length > 0 && (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {displayPlan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-success mt-0.5">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No active subscription</p>
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#A78BFA]" />
          {t("invoices.title")}
        </h2>

        {invoices.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{t("invoices.noInvoices")}</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">{t("invoices.amount")}</TableHead>
                  <TableHead className="font-semibold">{t("invoices.date")}</TableHead>
                  <TableHead className="font-semibold">Period</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {getInvoiceAmount(inv)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(inv.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {inv.periodStart && inv.periodEnd
                        ? `${formatDate(inv.periodStart)} → ${formatDate(inv.periodEnd)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-3">
                        {/* download PDF */}
                        {getInvoicePdf(inv) && (
                          <a
                            href={getInvoicePdf(inv)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-[#7C3AED] hover:underline"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {t("invoices.download")}
                          </a>
                        )}
                        {/* view on stripe */}
                        {inv.hostedInvoiceUrl && (
                          <a
                            href={inv.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}