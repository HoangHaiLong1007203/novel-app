export type AdminTransactionStatus = "success" | "failed" | "pending" | "canceled" | "unknown";
export type AdminTransactionType = "topup" | "purchase";
export type AdminTransactionProvider = "stripe" | "vnpay" | "system" | "unknown";

export interface AdminTransactionUser {
  username: string;
  email?: string;
  role?: string;
  coins?: number;
}

export interface AdminTransactionNovelInfo {
  title?: string | null;
}

export interface AdminTransactionChapterInfo {
  title?: string | null;
  chapterNumber?: number | null;
}

export interface AdminTransactionItem {
  _id: string;
  type: AdminTransactionType;
  amount: number;
  amountVnd?: number | null;
  provider?: string | null;
  status: AdminTransactionStatus;
  orderCode?: string | null;
  description?: string | null;
  statusReason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string;
  user?: AdminTransactionUser | null;
  novel?: AdminTransactionNovelInfo | null;
  chapter?: AdminTransactionChapterInfo | null;
}

export interface AdminTransactionSummary {
  totalVnd: number;
  totalCoins: number;
  count: number;
}

export interface AdminTransactionStatusBreakdown {
  status: AdminTransactionStatus;
  count: number;
}

export interface AdminTransactionProviderBreakdown {
  provider: string;
  totalVnd: number;
  count: number;
}

export interface AdminTransactionPagination {
  currentPage: number;
  limit: number;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminTransactionFiltersMeta {
  statuses: string[];
  providers: string[];
  types: string[];
}

export interface AdminTransactionsResponse {
  success: boolean;
  summary: AdminTransactionSummary;
  statusBreakdown: AdminTransactionStatusBreakdown[];
  providerBreakdown: AdminTransactionProviderBreakdown[];
  transactions: AdminTransactionItem[];
  pagination: AdminTransactionPagination;
  recentFailed: AdminTransactionItem[];
  filters: AdminTransactionFiltersMeta;
}

export interface AdminTransactionQuery {
  page?: number;
  limit?: number;
  status?: AdminTransactionStatus | "all";
  provider?: AdminTransactionProvider | "all";
  type?: AdminTransactionType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
