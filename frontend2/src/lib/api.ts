import axios from "axios";
import { NormalizedError } from "@/lib/errors";

export const API = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000", // fallback nếu quên .env
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
