"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ShieldCheck, Wallet, AlertTriangle } from "lucide-react";

import { useAuth } from "@/hook/useAuth";
import { createTopupSession, type PaymentProvider } from "@/lib/api";
import { toast } from "@/lib/toast";
import { toastApiError } from "@/lib/errors";
import { Button, Label, Separator } from "@/components/ui";

const COIN_STEP = 10;
const quickAmounts = [100, 200, 500, 1000];
const paymentWarning = "Hệ thống đang ở chế độ thử nghiệm, giao dịch không phát sinh tiền thật.";

const PROVIDERS: Array<{
  id: PaymentProvider;
  title: string;
  description: string;
  badge: string;
}> = [
  {
    id: "stripe",
    title: "Stripe (sandbox)",
    description: "Thanh toán bằng thẻ quốc tế",
    badge: "Thẻ/Visa",
  },
  {
    id: "vnpay",
    title: "VNPAY (sandbox)",
    description: "ATM, QR hoặc ví điện tử",
    badge: "Nội địa",
  },
];

export default function TopupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [coins, setCoins] = useState(200);
  const [provider, setProvider] = useState<PaymentProvider>("stripe");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountVnd = useMemo(() => coins * 100, [coins]);
  const formattedCoins = useMemo(() => coins.toLocaleString("vi-VN"), [coins]);
  const formattedVnd = useMemo(() => amountVnd.toLocaleString("vi-VN"), [amountVnd]);

  const handleAmountChange = (value: number) => {
    if (value < COIN_STEP) return;
    if (provider === "stripe" && value === 100) return;
    setCoins(value);
  };

  const handleProviderChange = (value: PaymentProvider) => {
    setProvider(value);
    if (value === "stripe" && coins === 100) {
      setCoins(200);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (coins % COIN_STEP !== 0) {
      toast.error(`Số xu phải là bội số của ${COIN_STEP}`);
      return;
    }
    setIsSubmitting(true);
    try {
      const envFrontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
      const envReturnPath = process.env.NEXT_PUBLIC_PAYMENT_RETURN_PATH;
      const fallbackReturn =
        typeof window !== "undefined" ? `${window.location.origin}/payments/payment-return` : undefined;
      const returnUrl = envFrontendUrl && envReturnPath
        ? `${envFrontendUrl.replace(/\/$/, "")}/${envReturnPath.replace(/^\//, "")}`
        : fallbackReturn;
      const { redirectUrl } = await createTopupSession({ coins, provider, returnUrl });
      toast.success("Chuyển đến cổng thanh toán...");
      window.location.href = redirectUrl;
    } catch (error) {
      toastApiError(error, "Không thể khởi tạo giao dịch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-10">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        ← Quay lại
      </Button>

      <div className="space-y-6 rounded-2xl border bg-card/60 p-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800">
            <AlertTriangle className="size-4" /> {paymentWarning}
          </div>
          <h1 className="text-2xl font-semibold">Nạp xu</h1>
          <p className="text-sm text-muted-foreground">
            Tỉ giá cố định 1.000 VND = 10 xu. Nhập số xu muốn nạp và chọn cổng thanh toán.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 items-start">
          <form className="space-y-5 md:col-span-1" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Số xu muốn nạp</Label>
              <p className="text-sm text-muted-foreground">Số xu phải là bội số của {COIN_STEP}.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((value) => {
                const isDisabled = provider === "stripe" && value === 100;
                return (
                <Button
                  type="button"
                  key={value}
                  variant={value === coins ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAmountChange(value)}
                  disabled={isDisabled}
                >
                  +{value.toLocaleString("vi-VN")} xu
                </Button>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Chọn cổng thanh toán</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {PROVIDERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleProviderChange(item.id)}
                    className={`rounded-xl border p-4 text-left transition ${
                      provider === item.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">{item.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
              {isSubmitting ? <ShieldCheck className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
              {isSubmitting ? "Đang chuyển hướng..." : "Thanh toán"}
            </Button>
          </form>

          <div className="space-y-4 rounded-2xl border bg-muted/40 p-5 md:col-span-1">
            <div className="flex items-center gap-3">
              <Wallet className="size-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Hóa đơn thanh toán</p>
                <p className="text-2xl font-semibold">{formattedVnd} VND</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số xu</span>
                <span className="font-medium">{formattedCoins} xu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tỉ giá</span>
                <span className="font-medium">1.000 VND = 10 xu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cổng thanh toán</span>
                <span className="font-medium">{provider === "stripe" ? "Stripe" : "VNPAY"}</span>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
              <p className="text-lg font-semibold">{(user?.coins ?? 0).toLocaleString("vi-VN")} xu</p>
            </div>
            <div className="rounded-lg bg-background/70 p-3 text-sm text-muted-foreground">
              • Stripe: chuyển sang trang Checkout của Stripe.<br />• VNPAY: chuyển sang trang VNPAY để xác thực và thanh toán.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
