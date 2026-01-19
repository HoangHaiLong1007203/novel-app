import axios from "axios";
import { NormalizedError } from "@/lib/errors";
import type {
  AdminTransactionItem,
  AdminTransactionQuery,
  AdminTransactionStatus,
  AdminTransactionsResponse,
} from "@/types/adminTransactions";
import type {
  AdminReportItem,
  AdminReportPriority,
  AdminReportQuery,
  AdminReportsResponse,
  AdminReportStatus,
} from "@/types/adminReports";

export const API = axios.create({
  baseURL: (() => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== "undefined") {
      // When opening built files via file:// (e.g. double-clicking .html),
      // window.location.protocol === 'file:' and hostname may be empty.
      // In that case, fall back to localhost:5000 so API calls still work locally.
      let proto: string;
      const hostname = window.location.hostname || "localhost";
      if (window.location.protocol === "file:") {
        // Local file usage: use http to talk to local backend
        proto = "http:";
      } else if (hostname === "localhost" || hostname === "127.0.0.1") {
        // Allow http for explicit local development hosts
        proto = "http:";
      } else {
        // For non-local hosts, enforce https regardless of page protocol
        proto = "https:";
      }
      const host = hostname;
      return `${proto}//${host}:5000`;
    }
    return "http://localhost:5000";
  })(), // fallback nếu quên .env; matches page protocol/host at runtime
  withCredentials: true,
});
// ✅ Thêm interceptor để tự động gắn token vào header
API.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
  // Only attach Authorization if token exists and is not empty
  if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
    config.headers.Authorization = `Bearer ${accessToken}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// Response interceptor: if 401, remove token and retry once without Authorization
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      localStorage.getItem("accessToken") &&
      !originalRequest._retry
    ) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      originalRequest._retry = true;
      delete originalRequest.headers.Authorization;
      return API(originalRequest);
    }
    // Chuẩn hoá lỗi để UI dễ hiển thị: luôn trả về object { status, message, details }
    const respData = error.response?.data as {
      message?: string;
      error?: string;
      details?: string | null;
    } | undefined;
    const message = respData?.message ?? respData?.error ?? error.message;
    const details = respData?.details ?? null;
    const status = error.response?.status ?? 500;
    const normalized: NormalizedError = { status, message, details, original: error };
    return Promise.reject(normalized);
  }
);
export async function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export async function getUserReadingProgress(page = 1, limit = 12) {
  const res = await API.get("/api/reading-progress", {
    params: { page, limit },
  });
  return res.data;
}

export async function getUserBookmarks(page = 1, limit = 12, novelId?: string) {
  const params: Record<string, unknown> = { page, limit };
  if (novelId) {
    params.novelId = novelId;
  }
  const res = await API.get("/api/bookmarks", { params });
  return res.data;
}

export async function addBookmark(novelId: string) {
  const res = await API.post(`/api/bookmarks/${novelId}`);
  return res.data;
}

export async function removeBookmark(novelId: string) {
  const res = await API.delete(`/api/bookmarks/${novelId}`);
  return res.data;
}

export async function markChapterAsRead(params: {
  novelId: string;
  chapterId: string;
  startedAt: string;
  completedAt: string;
  timeSpent: number;
}) {
  const res = await API.post("/api/reading-progress", {
    ...params,
    isRead: true,
  });
  return res.data;
}

export type ReaderSettingsPayload = {
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
  lineHeight?: number;
  theme?: "light" | "dark" | "sepia";
};

export async function fetchReaderSettings() {
  const res = await API.get("/api/auth/reader-settings");
  return res.data.settings;
}

export async function saveReaderSettings(settings: ReaderSettingsPayload) {
  const res = await API.put("/api/auth/reader-settings", settings);
  return res.data.settings;
}

export async function getChapterMeta(chapterId: string) {
  const res = await API.get(`/api/chapters/${chapterId}`);
  return res.data.chapter;
}

export async function requestChapterAccess(chapterId: string) {
  const res = await API.get(`/api/chapters/${chapterId}/access`);
  return res.data;
}

export async function purchaseLockedChapter(chapterId: string) {
  const res = await API.post(`/api/chapters/${chapterId}/purchase`);
  return res.data;
}

export type PaymentProvider = "stripe" | "vnpay";

export async function createTopupSession(payload: {
  coins: number;
  provider: PaymentProvider;
  returnUrl?: string;
}) {
  const res = await API.post("/api/payments/create", payload);
  return res.data as {
    transactionId: string;
    redirectUrl: string;
    provider: PaymentProvider;
    amountVnd: number;
    coins: number;
  };
}

export async function confirmTopup(payload: {
  provider: PaymentProvider;
  transactionId: string;
  sessionId?: string;
  vnpParams?: Record<string, string>;
}) {
  const res = await API.post("/api/payments/confirm", payload);
  return res.data as {
    status: "success" | "failed" | "canceled" | "pending";
    provider: PaymentProvider;
    coins?: number | null;
    transaction?: unknown;
    message?: string;
    responseCode?: string;
  };
}

export type ReportTargetType = "novel" | "chapter" | "comment" | "review" | "user" | "system";

export async function createReport(payload: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  targetTitle?: string;
  targetSnippet?: string;
}) {
  const res = await API.post("/api/reports", payload);
  return res.data;
}

export async function fetchAdminTransactions(params: AdminTransactionQuery = {}) {
  const res = await API.get<AdminTransactionsResponse>("/api/payments/transactions", {
    params,
  });
  return res.data;
}

export async function fetchAdminReports(params: AdminReportQuery = {}) {
  const res = await API.get<AdminReportsResponse>("/api/reports/admin", { params });
  return res.data;
}

type AdminTransactionActionResponse = {
  success: boolean;
  transaction: AdminTransactionItem;
  coins?: number | null;
  alreadyCompleted?: boolean;
};

type ResolvableAdminStatus = Extract<AdminTransactionStatus, "success" | "failed" | "canceled">;

export async function resolveAdminTransaction(transactionId: string, payload: { status: ResolvableAdminStatus; reason?: string }) {
  const res = await API.post<AdminTransactionActionResponse>(`/api/payments/transactions/${transactionId}/resolve`, payload);
  return res.data;
}

export async function retryAdminTransaction(transactionId: string) {
  const res = await API.post<AdminTransactionActionResponse>(`/api/payments/transactions/${transactionId}/retry`);
  return res.data;
}

export async function updateAdminReport(
  reportId: string,
  payload: { status?: AdminReportStatus; priority?: AdminReportPriority; resolutionNote?: string }
) {
  const res = await API.patch<{ success: boolean; report: AdminReportItem }>(`/api/reports/admin/${reportId}`, payload);
  return res.data;
}

export async function fetchUserTransactions(page = 1, limit = 20, type?: "topup" | "purchase") {
  const params: Record<string, unknown> = { page, limit };
  if (type) params.type = type;
  const res = await API.get("/api/payments/me", { params });
  return res.data as {
    transactions: Array<{
      _id: string;
      type: "topup" | "purchase";
      provider?: PaymentProvider | null;
      status: string;
      amount: number;
      amountVnd?: number;
      orderCode?: string;
      createdAt: string;
      novel?: { title?: string } | null;
      chapter?: { title?: string; chapterNumber?: number } | null;
    }>;
    pagination: { currentPage: number; totalPages: number; total: number; hasNextPage: boolean; hasPrevPage: boolean };
  };
}

export async function fetchNotifications(page = 1, limit = 20, isRead?: boolean) {
  const params: Record<string, unknown> = { page, limit };
  if (isRead !== undefined) params.isRead = String(isRead);
  const res = await API.get("/api/notifications", { params });
  type NotificationDto = {
    _id: string;
    title?: string;
    message?: string;
    type?: string;
    isRead?: boolean;
    createdAt?: string;
    relatedNovel?: { title?: string } | null;
    relatedChapter?: { title?: string; chapterNumber?: number } | null;
  };

  return res.data as {
    notifications: NotificationDto[];
    pagination: { currentPage: number; totalPages: number; totalNotifications: number; hasNextPage: boolean; hasPrevPage: boolean };
    unreadCount: number;
  };
}

export async function markNotificationRead(notificationId: string) {
  const res = await API.put(`/api/notifications/${notificationId}/read`);
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await API.put(`/api/notifications/mark-all-read`);
  return res.data;
}
