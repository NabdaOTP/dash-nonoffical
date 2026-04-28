
// Bundle 
export interface Bundle {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  status: "ACTIVE" | "SUSPENDED" | string;
  webhookUrl: string | null;
  webhookEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// BundleDetails 
export interface BundleDetails extends Bundle {
  instances: BundleSlot[];
  apiKey: {
    id: string;
    prefix: string;
    revoked: boolean;
    bundleId: string;
  } | null;
}

// Create response
export interface BundleCreateResponse extends Bundle {
  apiKey: string;
}

// Slot 
export interface BundleSlot {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  status: string;
  webhookUrl: string | null;
  webhookEnabled: boolean;
  expiresAt: string | null;
  isTrialInstance: boolean;
  bundleId: string;
  session: BundleSlotSession | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BundleSlotSession {
  id: string;
  status: string;
  phoneNumber: string | null;
  lastConnectedAt: string | null;
}

// Messages 

export interface BundleMessage {
  id: string;
  phone: string;
  message: string;
  status: "queued" | "sent" | "invalid" | string;
  createdAt: string;
}

export interface BundleMessagesResponse {
  items: BundleMessage[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Forms

export interface CreateBundleRequest {
  name: string;
  webhookUrl?: string;
}

export interface UpdateBundleRequest {
  name?: string;
  webhookUrl?: string;
  webhookEnabled?: boolean;
}