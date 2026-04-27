import { api } from "@/lib/api-client";
import type {
  Bundle, BundleDetails, BundleSlot,
  BundleMessagesResponse, CreateBundleRequest, UpdateBundleRequest,
  BundleCreateResponse,
} from "../types";

const userScope = { tokenScope: "user" as const };

// Bundles CRUD

export async function getMyBundles(): Promise<Bundle[]> {
  const result = await api.get<Bundle[]>("/api/v1/bundles", userScope);
  return Array.isArray(result) ? result : [];
}

export async function getBundleById(id: string): Promise<BundleDetails> {
  return api.get<BundleDetails>(`/api/v1/bundles/${id}`, userScope);
}

export async function getCurrentBundle(): Promise<BundleDetails> {
  return api.get<BundleDetails>("/api/v1/bundles/me/current", userScope);
}

export async function createBundle(data: CreateBundleRequest): Promise<BundleCreateResponse> {
  return api.post<BundleCreateResponse>("/api/v1/bundles", data, userScope);
}

export async function updateBundle(id: string, data: UpdateBundleRequest): Promise<Bundle> {
  return api.patch<Bundle>(`/api/v1/bundles/${id}`, data, userScope);
}

export async function updateBundleStatus(id: string, status: "ACTIVE" | "SUSPENDED"): Promise<Bundle> {
  return api.patch<Bundle>(`/api/v1/bundles/${id}/status`, { status }, userScope);
}

export async function deleteBundle(id: string): Promise<void> {
  return api.delete<void>(`/api/v1/bundles/${id}`, userScope);
}

// API Key

export async function rotateBundleApiKey(id: string): Promise<{ apiKey: string }> {
  return api.post<{ apiKey: string }>(`/api/v1/bundles/${id}/api-key/rotate`, {}, userScope);
}

// Messages

export async function getBundleMessages(
  id: string,
  params?: { status?: string; page?: number; limit?: number }
): Promise<BundleMessagesResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  return api.get<BundleMessagesResponse>(
    `/api/v1/bundles/${id}/messages?${query}`, userScope
  );
}

// Slots 

export async function getBundleSlots(id: string): Promise<BundleSlot[]> {
  const result = await api.get<BundleSlot[]>(`/api/v1/bundles/${id}/slots`, userScope);
  return Array.isArray(result) ? result : [];
}

export async function purchaseBundleSlot(
  id: string,
  interval: "MONTHLY" | "YEARLY"
): Promise<{ instanceId: string; checkoutUrl: string }> {
  return api.post(`/api/v1/bundles/${id}/slots`, { interval }, userScope);
}

export async function deleteBundleSlot(bundleId: string, slotId: string): Promise<void> {
  return api.delete<void>(`/api/v1/bundles/${bundleId}/slots/${slotId}`, userScope);
}

export async function repurchaseBundleSlot(
  bundleId: string,
  slotId: string,
  interval: "MONTHLY" | "YEARLY"
): Promise<{ checkoutUrl: string }> {
  return api.post(`/api/v1/bundles/${bundleId}/slots/${slotId}/repurchase`, { interval }, userScope);
}