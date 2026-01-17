"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, AlertCircle } from "lucide-react";

import { confirmTopup, type PaymentProvider, API } from "@/lib/api";
import { toastApiError } from "@/lib/errors";
import { Button, Separator } from "@/components/ui";
import { useAuth } from "@/hook/useAuth";

interface PaymentResult {
  status: "pending" | "success" | "failed" | "canceled";
  provider: PaymentProvider | null;
  message?: string;
  responseCode?: string;
  coins: number | null;
}

const STATUS_CONFIG: Record<PaymentResult["status"], { title: string; description: string; icon: React.ReactNode; color: string }> = {
  pending: {
    title: "Đang xác nhận",
    description: "Hệ thống đang kiểm tra kết quả thanh toán...",
    icon: <Loader2 className="size-10 animate-spin text-muted-foreground" />,
    color: "text-muted-foreground",
  },
  success: {
    title: "Thanh toán thành công",
    description: "Xu đã được cộng vào tài khoản.",
    icon: <CheckCircle2 className="size-10 text-emerald-500" />,
    color: "text-emerald-600",
  },
  failed: {
    title: "Thanh toán thất bại",
    description: "Vui lòng thử lại hoặc chọn phương thức khác.",
    icon: <XCircle className="size-10 text-destructive" />,
    color: "text-destructive",
  },
  canceled: {
    title: "Giao dịch bị hủy",
    description: "Bạn đã hủy thanh toán tại cổng hoặc giao dịch hết hạn.",
    icon: <AlertCircle className="size-10 text-amber-500" />,
    color: "text-amber-600",
  },
};

export default function PaymentReturnClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, setUser } = useAuth();

  const provider = (searchParams.get("provider") as PaymentProvider) || null;
  const transactionId = searchParams.get("transactionId");
  const sessionId = searchParams.get("session_id") || searchParams.get("sessionId");

  const [result, setResult] = useState<PaymentResult>({ status: "pending", provider, coins: null });
  const [isLoading, setIsLoading] = useState(true);

  const vnpParams = useMemo(() => {
    const payload: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("vnp_")) {
        payload[key] = value;
      }
    });
    return Object.keys(payload).length ? payload : null;
  }, [searchParams]);

  useEffect(() => {
    const executeConfirm = async () => {
      if (!provider || !transactionId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await confirmTopup({ provider, transactionId, sessionId: sessionId || undefined, vnpParams: vnpParams || undefined });
        setResult({
          status: data.status ?? "failed",
          provider,
          message: data.message,
          responseCode: data.responseCode,
          coins: typeof data.coins === "number" ? data.coins : null,
        });
        if (typeof data.coins === "number") {
          try {
            const res = await API.get("/api/auth/me");
            setUser(res.data);
          } catch (error) {
            console.error("Failed to refresh user after topup:", error);
            // fallback: update only coins if full user fetch fails
            if (user) setUser({ ...user, coins: data.coins });
          }
        }
      } catch (error) {
        toastApiError(error, "Không thể xác nhận giao dịch");
        setResult((prev) => ({ ...prev, status: "failed" }));
      } finally {
        setIsLoading(false);
      }
    };
    executeConfirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, transactionId, sessionId, vnpParams]);

  const statusConfig = STATUS_CONFIG[result.status];

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Button variant="ghost" className="w-fit" onClick={() => router.push("/me/profile")}>
        <ArrowLeft className="mr-1 size-4" /> Về trang cá nhân
      </Button>

      <div className="rounded-3xl border bg-card/70 p-8 text-center shadow-sm">
        <div className="flex flex-col items-center gap-4">
          {statusConfig.icon}
          <div>
            <p className={`text-2xl font-semibold ${statusConfig.color}`}>{statusConfig.title}</p>
            <p className="text-sm text-muted-foreground">{result.message || statusConfig.description}</p>
          </div>
          {result.responseCode ? (
            <p className="text-xs text-muted-foreground">Mã phản hồi: {result.responseCode}</p>
          ) : null}
        </div>

        <Separator className="my-6" />

        <div className="grid gap-4 text-left md:grid-cols-2">
          <InfoItem label="Phương thức" value={provider ? provider.toUpperCase() : "Không xác định"} />
          <InfoItem label="Mã giao dịch" value={transactionId ?? "--"} />
          <InfoItem label="Trạng thái" value={statusConfig.title} />
          <InfoItem label="Số dư mới" value={result.coins != null ? `${result.coins.toLocaleString("vi-VN")} xu` : (user?.coins != null ? `${user.coins.toLocaleString("vi-VN")} xu` : "--")} />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push("/me/profile")}>Quay lại hồ sơ</Button>
          <Button variant="secondary" onClick={() => router.push("/me/topup")}>Nạp thêm xu</Button>
        </div>
      </div>

      {!isLoading && result.status !== "success" ? (
        <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          <p className="font-medium">Gợi ý xử lý:</p>
          <ul className="list-inside list-disc">
            <li>Đảm bảo thanh toán đã hoàn tất tại cổng Stripe/VNPAY.</li>
            <li>Nếu tiền đã trừ nhưng chưa cộng xu, liên hệ admin với mã giao dịch ở trên.</li>
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
