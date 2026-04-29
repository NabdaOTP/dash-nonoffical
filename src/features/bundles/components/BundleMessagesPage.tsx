"use client";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBundleById, getBundleMessages } from "@/features/bundles/services/bundle-service";
import type { BundleMessage, BundleMessagesResponse } from "@/features/bundles/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type TabValue = "all" | "queued" | "sent" | "invalid";

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  } catch { return "—"; }
}

const statusColors: Record<string, string> = {
  sent: "bg-success/10 text-success border-success/20",
  queued: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  invalid: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function BundleMessagesPage({
  bundleId,
  locale,
}: {
  bundleId: string;
  locale: string;
}) {
  const t = useTranslations("bundles");

  const [bundleName, setBundleName] = useState("");
  const [tab, setTab] = useState<TabValue>("all");
  const [messages, setMessages] = useState<BundleMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);

  useEffect(() => {
    getBundleById(bundleId)
      .then((b) => setBundleName(b.name))
      .catch(() => setBundleName(bundleId.slice(0, 8)));
  }, [bundleId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const status = tab === "all" ? undefined : tab;
        const res: BundleMessagesResponse = await getBundleMessages(bundleId, { status, page, limit });
        if (!cancelled) {
          setMessages(res.items);
          setTotal(res.meta.total);
          setTotalPages(Math.max(1, res.meta.totalPages));
        }
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [bundleId, tab, page, limit]);

  useEffect(() => { setPage(1); }, [tab]);

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="py-10 text-center text-sm text-muted-foreground">
          {t("messagesPage.empty")}
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="whitespace-nowrap w-10">{t("messagesPage.table.index")}</TableHead>
                <TableHead className="whitespace-nowrap">{t("messagesPage.table.to")}</TableHead>
                <TableHead className="whitespace-nowrap">{t("messagesPage.table.status")}</TableHead>
                <TableHead className="whitespace-nowrap">{t("messagesPage.table.body")}</TableHead>
                <TableHead className="whitespace-nowrap">{t("messagesPage.table.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((m, index) => (
                <TableRow
                  key={m.id}
                  className={m.status === "sent" ? "bg-green-50/50 dark:bg-green-950/10" : ""}
                >
                  <TableCell className="text-xs text-muted-foreground">
                    {(page - 1) * limit + index + 1}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{m.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusColors[m.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {t(`messagesPage.tabs.${m.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-xs truncate">{m.message}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(m.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <div>{t("messagesPage.pagination.info", { page, totalPages, total })}</div>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              {t("messagesPage.pagination.previous")}
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              {t("messagesPage.pagination.next")}
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${locale}`}>{t("messagesPage.breadcrumb.home")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${locale}/bundles`}>{t("messagesPage.breadcrumb.bundles")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${locale}/bundles/${bundleId}`}>
                {bundleName || bundleId.slice(0, 8)}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("messagesPage.breadcrumb.messages")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold mb-1 text-foreground">{t("messagesPage.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {bundleName || bundleId.slice(0, 8)} —{" "}
            <span className="text-sm font-medium text-white bg-linear-to-r from-[#A78BFA] to-[#7C3AED] px-1.5 py-0.5 rounded-sm">
              {total}
            </span>{" "}
            <span className="text-lg font-semibold">{t("messagesPage.title")}</span>
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList className="mb-4">
            <TabsTrigger className="data-[state=active]:bg-linear-to-r from-[#A78BFA] to-[#7C3AED]" value="all">{t("messagesPage.tabs.all")}</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-linear-to-r from-[#A78BFA] to-[#7C3AED]" value="queued">{t("messagesPage.tabs.queued")}</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-linear-to-r from-[#A78BFA] to-[#7C3AED]" value="sent">{t("messagesPage.tabs.sent")}</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-linear-to-r from-[#A78BFA] to-[#7C3AED]" value="invalid">{t("messagesPage.tabs.invalid")}</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-0">{renderTable()}</TabsContent>
          <TabsContent value="queued" className="mt-0">{renderTable()}</TabsContent>
          <TabsContent value="sent" className="mt-0">{renderTable()}</TabsContent>
          <TabsContent value="invalid" className="mt-0">{renderTable()}</TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
