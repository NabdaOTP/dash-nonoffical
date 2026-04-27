export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  deletedAt: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  twoFactorEnabled: boolean;
}

export interface AdminInstance {
  id: string;
  name: string;
  slug: string;
  status: string;
  ownerId: string;
  expiresAt: string | null;
  isTrialInstance: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
// Invoice
export interface AdminInvoice {
  id: string;
  instanceId: string;
  subscriptionId?: string;
  stripeInvoiceId?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  paymentIntentId?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  baseAmountUsd?: string;
  overageAmountUsd?: string;
  totalAmountUsd?: string;
  currency: string;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  pdfUrl?: string;
  attemptCount?: number;
  nextPaymentAttempt?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  status: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  metadata?: {
    planId?: string;
    planCode?: string;
    interval?: string;
    instanceId?: string;
    userId?: string;
  };
}

//Plans 
export interface AdminPlan {
  id: string;
  name: string;
  code?: string;
  description?: string;
  price: number;
  priceUsd?: number;
  interval: string;
  freeTrialDays?: number;
  features: string[];
  isFeatured?: boolean;
  badgeText?: string;
  stripeProductId?: string;
  stripePriceId?: string;
}

export interface AdminSubscription {
  id: string;
  instanceId: string;
  planId?: string;
  plan?: AdminPlan;
  status: string;
  isActive: boolean;
  autoRenew: boolean;
  billingInterval?: string;
  priceUsd?: number;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialEnd?: string | null;
  trialExtended?: boolean;
  startedAt?: string;
  createdAt: string;
}
// Proxy
export interface ProxySession {
  id: string;
  instanceId: string;
  ownerId: string;
  status: string;
  phoneNumber: string;
  lastConnectedAt: string | null;
  proxyId: string;
}

export interface AdminProxy {
  id: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  type?: string;
  isActive: boolean;
  maxSessions?: number;
  sessions?: ProxySession[];
  createdAt: string;
}

export interface AdminProxyStats {
  id: string;
  host: string;
  port: number;
  activeSessions: number;
  maxSessions: number;
  isActive: boolean;
}

// Stats
export interface AdminStatsData {
  totals: {
    users: number;
    instances: number;
    activeSubscriptions: number;
    mrr: number;
  };
  invoices: {
    totalPaid: number;
  };
}

// Protection

export interface ProtectionLimit {
  perMin: number;
  perHour: number;
}
 
export interface SoftBanRequest {
  seconds: number;
}
 
export interface ReconnectRequest {
  baseMs: number;
  maxMs: number;
}


// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Referral Admin Types

export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AdminReferralWithdrawal {
  id: string;
  userId: string;
  userName?: string;
  amount: number;
  contactDetails: string;
  status: WithdrawalStatus;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReferralWithdrawalsResponse {
  items: AdminReferralWithdrawal[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface UpdateWithdrawalPayload {
  status: WithdrawalStatus;
  adminNote?: string;
}

// Referral Settings
export interface AdminReferralSettings {
  id: string;
  isEnabled: boolean;
  minWithdrawalAmount: number;
  recurringPointsPeriodMonths: number;
  pointsPerSubscription: number;
  createdAt: string;
  updatedAt: string;
}

// Backfill Response
export interface ReferralBackfillResponse {
  message: string;
  createdCount?: number;
}

// Bundle Types
export interface AdminBundle {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  status: string;
  webhookUrl: string | null;
  webhookEnabled: boolean;
  createdAt: string;
  apiKey?: {
    prefix: string;
    revoked: boolean;
  } | null;
}