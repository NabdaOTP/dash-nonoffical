"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getAdminInvoices } from "@/features/admin/services/admin-service";
import type { AdminInvoice } from "@/features/admin/types";
import { Download, ExternalLink, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";


function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch { return "—"; }
}

function formatAmount(amount?: string | null): string {
  if (!amount) return "—";
  return `$${parseFloat(amount).toFixed(2)}`;
}

const statusStyles: Record<string, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  open: "bg-blue-100 text-blue-700 border-blue-200",
  void: "bg-gray-100 text-gray-600 border-gray-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  draft: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const STATUS_FILTERS = ["all", "paid", "open", "void", "failed", "draft"];

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const limit = 20;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminInvoices(page, limit, { status: statusFilter });
      setInvoices(res.items);
      setTotal(res.meta.total);
      setTotalPages(res.meta.pages);
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const filtered = invoices.filter((inv) =>
    inv.instanceId?.toLowerCase().includes(search.toLowerCase()) ||
    inv.stripeInvoiceId?.toLowerCase().includes(search.toLowerCase()) ||
    inv.metadata?.planCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} total invoices</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by instance ID or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 bg-card"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Instance ID</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Paid At</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-end">Links</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((inv, index) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {inv.instanceId?.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-xs">
                        {inv.metadata?.planCode ? (
                          <Badge variant="outline" className="text-xs font-mono">
                            {inv.metadata.planCode}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatAmount(inv.totalAmountUsd)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs capitalize ${statusStyles[inv.status?.toLowerCase() ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inv.metadata?.interval ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(inv.paidAt)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(inv.createdAt)}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-2">
                          {inv.invoicePdf && (
                            <a href={inv.invoicePdf} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-[#7C3AED] hover:underline flex items-center gap-1">
                              <Download className="h-3.5 w-3.5" />
                              PDF
                            </a>
                          )}
                          {inv.hostedInvoiceUrl && (
                            <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                              <ExternalLink className="h-3.5 w-3.5" />
                              View
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} • {total} invoices
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}>
                  Previous
                </Button>
                <Button variant="outline" size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}