import { api } from "@/lib/api-client";
import { AdminBundle, AdminInstance, AdminInvoice, AdminPlan, AdminProxy, AdminReferralSettings, AdminReferralWithdrawalsResponse, AdminStatsData, AdminSubscription, AdminUser, ImpersonateResponse, PaginatedResponse, ProtectionLimit, ReconnectRequest, ReferralBackfillResponse, SoftBanRequest, UpdateWithdrawalPayload, WithdrawalStatus } from "../types";
import { BundleSlot } from "@/features/bundles/types";

const adminScope = { tokenScope: "user" as const };


// Users 

export async function getAdminUsers(page = 1, limit = 20, search?: string): Promise<PaginatedResponse<AdminUser>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return api.get<PaginatedResponse<AdminUser>>(
    `/api/v1/admin/users?${params}`,
    adminScope
  );
}

export async function updateAdminUser(id: string, data: Partial<AdminUser>): Promise<AdminUser> {
  return api.patch<AdminUser>(`/api/v1/admin/users/${id}`, data, adminScope);
}

export async function deactivateUser(id: string): Promise<void> {
  return api.patch<void>(`/api/v1/admin/users/${id}/deactivate`, {}, adminScope);
}

export async function softDeleteUser(id: string): Promise<void> {
  return api.patch<void>(`/api/v1/admin/users/${id}/soft-delete`, {}, adminScope);
}

export async function restoreUser(id: string): Promise<void> {
  return api.patch<void>(`/api/v1/admin/users/${id}/restore`, {}, adminScope);
}


export async function impersonateUser(id: string): Promise<ImpersonateResponse> {
  return api.post<ImpersonateResponse>(
    `/api/v1/admin/users/${id}/impersonate`,
    {},
    adminScope
  );
}

// Instances

interface InstancesRawResponse {
  data: AdminInstance[];
  meta: { total: number; page: number; limit: number };
}

export async function getAdminInstances(page = 1, limit = 20): Promise<PaginatedResponse<AdminInstance>> {
  const res = await api.get<InstancesRawResponse>(
    `/api/v1/admin/instances?page=${page}&limit=${limit}`, adminScope
  );

  return {
    items: res.data,
    meta: {
      total: res.meta.total,
      page: res.meta.page,
      limit: res.meta.limit,
      pages: Math.ceil(res.meta.total / res.meta.limit),
    },
  };
}

export async function getAdminInstance(id: string): Promise<AdminInstance> {
  return api.get<AdminInstance>(`/api/v1/admin/instances/${id}`, adminScope);
}

export async function updateAdminInstance(id: string, data: Partial<AdminInstance>): Promise<AdminInstance> {
  return api.patch<AdminInstance>(`/api/v1/admin/instances/${id}`, data, adminScope);
}

// Invoices

export async function getAdminInvoices(
  page = 1,
  limit = 20,
  filters?: { status?: string; instanceId?: string; subscriptionId?: string }
): Promise<PaginatedResponse<AdminInvoice>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.instanceId) params.set("instanceId", filters.instanceId);
  if (filters?.subscriptionId) params.set("subscriptionId", filters.subscriptionId);
  return api.get<PaginatedResponse<AdminInvoice>>(
    `/api/v1/admin/invoices?${params}`, adminScope
  );
}

export async function getAdminInvoice(id: string): Promise<AdminInvoice> {
  return api.get<AdminInvoice>(`/api/v1/admin/invoices/${id}`, adminScope);
}

// Plans

export async function getAdminPlans(): Promise<AdminPlan[]> {
  return api.get<AdminPlan[]>("/api/v1/admin/plans", adminScope);
}

export async function createAdminPlan(data: Partial<AdminPlan>): Promise<AdminPlan> {
  return api.post<AdminPlan>("/api/v1/admin/plans", data, adminScope);
}

export async function updateAdminPlan(id: string, data: Partial<AdminPlan>): Promise<AdminPlan> {
  return api.patch<AdminPlan>(`/api/v1/admin/plans/${id}`, data, adminScope);
}

export async function deleteAdminPlan(id: string): Promise<void> {
  return api.delete<void>(`/api/v1/admin/plans/${id}`, adminScope);
}

// Subscriptions 

export async function getAdminSubscriptions(
  page = 1,
  limit = 20,
  filters?: { instanceId?: string }
): Promise<PaginatedResponse<AdminSubscription>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.instanceId) params.set("instanceId", filters.instanceId);
  return api.get<PaginatedResponse<AdminSubscription>>(
    `/api/v1/admin/subscriptions?${params}`, adminScope
  );
}

// Proxies 

export async function getAdminProxies(): Promise<AdminProxy[]> {
  return api.get<AdminProxy[]>("/api/v1/admin/proxies", adminScope);
}

export async function getAdminProxyStats(): Promise<unknown> {
  return api.get("/api/v1/admin/proxies/stats", adminScope);
}

export async function createAdminProxy(data: Partial<AdminProxy>): Promise<AdminProxy> {
  return api.post<AdminProxy>("/api/v1/admin/proxies", data, adminScope);
}

export async function updateAdminProxy(id: string, data: Partial<AdminProxy>): Promise<AdminProxy> {
  return api.patch<AdminProxy>(`/api/v1/admin/proxies/${id}`, data, adminScope);
}

export async function deleteAdminProxy(id: string): Promise<void> {
  return api.delete<void>(`/api/v1/admin/proxies/${id}`, adminScope);
}

// Stats

export async function getAdminStats(): Promise<AdminStatsData> {
  return api.get("/api/v1/admin/stats", adminScope);
}

// Protection 
export async function getProtection(): Promise<unknown> {
  return api.get("/api/v1/admin/protection", adminScope);
}

export async function setNewLimit(data: ProtectionLimit): Promise<void> {
  return api.post<void>("/api/v1/admin/protection/limits/new", data, adminScope);
}

export async function setWarmLimit(data: ProtectionLimit): Promise<void> {
  return api.post<void>("/api/v1/admin/protection/limits/warm", data, adminScope);
}

export async function setTrustedLimit(data: ProtectionLimit): Promise<void> {
  return api.post<void>("/api/v1/admin/protection/limits/trusted", data, adminScope);
}

export async function softBan(data: SoftBanRequest): Promise<void> {
  return api.post<void>("/api/v1/admin/protection/soft-ban", data, adminScope);
}

export async function reconnect(data: ReconnectRequest): Promise<void> {
  return api.post<void>("/api/v1/admin/protection/reconnect", data, adminScope);
}


// Referrals Admin 
export async function getAdminReferralWithdrawals(
  page = 1,
  limit = 20,
  status?: WithdrawalStatus
): Promise<AdminReferralWithdrawalsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("status", status);

  return api.get<AdminReferralWithdrawalsResponse>(
    `/api/v1/admin/referrals/withdrawals?${params}`,
    adminScope
  );
}

export async function updateAdminReferralWithdrawal(
  id: string,
  data: UpdateWithdrawalPayload
): Promise<void> {
  return api.patch<void>(
    `/api/v1/admin/referrals/withdrawals/${id}`,
    data,
    adminScope
  );
}

export async function getAdminReferralSettings(): Promise<AdminReferralSettings> {
  return api.get<AdminReferralSettings>(
    "/api/v1/admin/referrals/settings",
    adminScope
  );
}

export async function updateAdminReferralSettings(
  data: Partial<AdminReferralSettings>
): Promise<AdminReferralSettings> {
  return api.put<AdminReferralSettings>(
    "/api/v1/admin/referrals/settings",
    data,
    adminScope
  );
}

export async function backfillReferrals(): Promise<ReferralBackfillResponse> {
  return api.post<ReferralBackfillResponse>(
    "/api/v1/admin/referrals/backfill",
    undefined,
    adminScope
  );
}

// Bundle Services
export async function getAdminBundles(): Promise<AdminBundle[]> {
  const res = await api.get<AdminBundle[]>("/api/v1/admin/bundles", adminScope);
  return Array.isArray(res) ? res : [];
}

export async function updateAdminBundleStatus(id: string, status: "ACTIVE" | "SUSPENDED"): Promise<void> {
  await api.patch(`/api/v1/admin/bundles/${id}/status`, { status }, adminScope);
}

export async function deleteAdminBundle(id: string): Promise<void> {
  await api.delete(`/api/v1/admin/bundles/${id}`, adminScope);
}

export async function rotateAdminBundleApiKey(id: string): Promise<{ apiKey: string }> {
  return api.post<{ apiKey: string }>(`/api/v1/admin/bundles/${id}/api-key/rotate`, {}, adminScope);
}

export async function getAdminBundleSlots(id: string): Promise<BundleSlot[]> {
  const res = await api.get<BundleSlot[]>(`/api/v1/admin/bundles/${id}/slots`, adminScope);
  return Array.isArray(res) ? res : [];
}