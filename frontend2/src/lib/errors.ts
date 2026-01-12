import { isAxiosError } from "axios";
import { toast, type ToastOptions } from "@/lib/toast";

export type NormalizedError = {
  status?: number;
  message?: string;
  details?: string | null;
  original?: unknown;
};

type ErrorResponseBody = {
  message?: string;
  error?: string;
  details?: string;
};

export function toNormalizedError(error: unknown): NormalizedError {
  if (!error) {
    return { original: error };
  }

  if (typeof error === "string") {
    return { message: error, original: error };
  }

  if (error instanceof Error) {
    return { message: error.message, original: error };
  }

  if (typeof error === "object") {
    const maybe = error as Partial<NormalizedError> & {
      response?: { status?: number; data?: ErrorResponseBody };
    };

    if (typeof maybe.status !== "undefined" || typeof maybe.message === "string" || typeof maybe.details === "string") {
      return {
        status: maybe.status,
        message: maybe.message,
        details: maybe.details,
        original: "original" in maybe ? maybe.original : error,
      };
    }

    if (isAxiosError(maybe)) {
      const data = maybe.response?.data as ErrorResponseBody | undefined;
      return {
        status: maybe.response?.status,
        message: data?.message || data?.error || maybe.message,
        details: data?.details,
        original: error,
      };
    }
  }

  return { original: error };
}

export function getErrorMessage(error: unknown, fallback = "Đã có lỗi, vui lòng thử lại.") {
  const normalized = toNormalizedError(error);
  if (normalized.message && typeof normalized.message === "string") {
    return normalized.message;
  }
  return fallback;
}

export function toastApiError(
  error: unknown,
  fallback = "Đã có lỗi, vui lòng thử lại.",
  options?: ToastOptions
) {
  const message = getErrorMessage(error, fallback);
  toast.error(message, options);
  return message;
}
