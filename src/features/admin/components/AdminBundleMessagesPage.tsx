"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const adminScope = { tokenScope: "user" as const };

interface BundleMessage {
  id: string;
  phone: string;
  message: string;
  status: "queued" | "sent" | "invalid" | string;
  createdAt: string;
}

interface MessagesResponse {
  items: BundleMessage[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getAdminBundleMessages(
  bundleId: string,
  params?: { status?: string; page?: number; limit?: number }
): Promise<MessagesResponse> {
  const query = new URLSearchParams();
  query.set("page", String(params?.page ?? 1));
  query.set("limit", String(params?.limit ?? 50));
  if (params?.status && params.status !== "all") query.set("status", params.status);
  return api.get<MessagesResponse>(
    `/api/v1/admin/bundles/${bundleId}/messages?${query}`, adminScope
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch { return "—"; }
}

const msgStatusStyles: Record<string, string> = {
  sent:    "bg-green-100 text-green-700 border-green-200",
  queued:  "bg-blue-100 text-blue-700 border-blue-200",
  invalid: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminBundleMessagesPage({ bundleId }: { bundleId: string }) {
  const [messages, setMessages] = useState<BundleMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();
  const locale = useLocale();
  const limit = 50;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminBundleMessages(bundleId, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit,
      });
      setMessages(res.items);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [bundleId, statusFilter, page]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost" size="icon"
          onClick={() => router.push(`/${locale}/admin/bundles`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bundle Messages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} total messages
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="invalid">Invalid</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchMessages} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

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
                  <TableHead>Phone</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No messages found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((msg, index) => (
                    <TableRow key={msg.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{msg.phone}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate text-muted-foreground">
                        {msg.message}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs capitalize ${msgStatusStyles[msg.status] ?? "bg-muted text-muted-foreground"}`}>
                          {msg.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(msg.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} • {total} messages
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
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