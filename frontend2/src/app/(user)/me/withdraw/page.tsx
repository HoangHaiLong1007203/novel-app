"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDownToLine, Landmark, Wallet } from "lucide-react";

import { useAuth } from "@/hook/useAuth";
import { createWithdrawRequest, type BankAccountPayload } from "@/lib/api";
import { toast } from "@/lib/toast";
import { toastApiError } from "@/lib/errors";
import { Button, Input, Label, Separator } from "@/components/ui";

const COIN_STEP = 10;
const WITHDRAW_RATE = 80; // 1 xu = 80 VND => 10 xu = 800 VND
const withdrawWarning = "Chức năng rút xu chỉ cập nhật số liệu, không chuyển tiền thực tế.";

export default function WithdrawPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [coinsInput, setCoinsInput] = useState("0");
  const [useSavedAccount, setUseSavedAccount] = useState(false);
  const [bankForm, setBankForm] = useState<BankAccountPayload>({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSavedAccount = Boolean(
    user?.bankAccount?.bankName && user?.bankAccount?.accountNumber && user?.bankAccount?.accountHolder
  );

  useEffect(() => {
    if (!user) return;
    if (hasSavedAccount) {
      setUseSavedAccount(true);
    }
  }, [user, hasSavedAccount]);

  useEffect(() => {
    if (useSavedAccount && user?.bankAccount) {
      setBankForm({
        bankName: user.bankAccount.bankName || "",
        accountNumber: user.bankAccount.accountNumber || "",
        accountHolder: user.bankAccount.accountHolder || "",
      });
    }
  }, [useSavedAccount, user]);

  const coins = Number(coinsInput);
  const isValidCoins = Number.isFinite(coins) && coins >= COIN_STEP && coins % COIN_STEP === 0;
  const vndAmount = isValidCoins ? coins * WITHDRAW_RATE : 0;
  const hasEnoughCoins = user?.coins != null ? coins <= user.coins : false;

  const canSubmit = isValidCoins && hasEnoughCoins && bankForm.bankName && bankForm.accountNumber && bankForm.accountHolder;

  const formattedCoins = useMemo(() => (isValidCoins ? coins.toLocaleString("vi-VN") : "0"), [coins, isValidCoins]);
  const formattedVnd = useMemo(() => vndAmount.toLocaleString("vi-VN"), [vndAmount]);

  if (!user) {
    return (
      <section className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center gap-3 px-4 py-10 text-center">
        <p className="text-lg font-semibold">Bạn cần đăng nhập để rút xu.</p>
        <p className="text-sm text-muted-foreground">Vui lòng đăng nhập trước khi gửi yêu cầu.</p>
      </section>
    );
  }

  const handleBankChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setBankForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidCoins) {
      toast.error(`Số xu phải là bội số của ${COIN_STEP}`);
      return;
    }
    if (!hasEnoughCoins) {
      toast.error("Số dư không đủ");
      return;
    }
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolder) {
      toast.error("Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng");
      return;
    }

    try {
      setIsSubmitting(true);
      await createWithdrawRequest({
        coins,
        bankAccount: {
          bankName: bankForm.bankName.trim(),
          accountNumber: bankForm.accountNumber.trim(),
          accountHolder: bankForm.accountHolder.trim(),
        },
      });
      toast.success("Đã gửi yêu cầu rút xu");
      setCoinsInput("0");
    } catch (error) {
      toastApiError(error, "Không thể gửi yêu cầu rút xu");
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
            <AlertTriangle className="size-4" /> {withdrawWarning}
          </div>
          <h1 className="text-2xl font-semibold">Rút xu</h1>
          <p className="text-sm text-muted-foreground">Tỉ giá cố định 10 xu = 800 VND. Nhập số xu và thông tin ngân hàng để gửi yêu cầu rút.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 items-start">
          <form className="space-y-5 md:col-span-1" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Số xu muốn rút</Label>
              <p className="text-sm text-muted-foreground">Số xu phải là bội số của {COIN_STEP}.</p>
              <Input
                type="number"
                min={COIN_STEP}
                step={COIN_STEP}
                value={coinsInput}
                onChange={(event) => setCoinsInput(event.target.value)}
                placeholder="Nhập số xu"
              />
            </div>

            {hasSavedAccount ? (
              <div className="space-y-3 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Tài khoản đã lưu</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setUseSavedAccount((prev) => !prev)}>
                    {useSavedAccount ? "Nhập tài khoản khác" : "Dùng tài khoản đã lưu"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Ngân hàng: {user.bankAccount?.bankName ?? "--"}</p>
                <p className="text-sm text-muted-foreground">Số tài khoản: {user.bankAccount?.accountNumber ?? "--"}</p>
                <p className="text-sm text-muted-foreground">Chủ tài khoản: {user.bankAccount?.accountHolder ?? "--"}</p>
              </div>
            ) : null}

            {!useSavedAccount ? (
              <div className="space-y-4 rounded-xl border p-4">
                <p className="text-sm font-semibold">Thông tin tài khoản ngân hàng</p>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Ngân hàng</Label>
                  <Input id="bankName" name="bankName" value={bankForm.bankName} onChange={handleBankChange} placeholder="VD: Vietcombank" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Số tài khoản</Label>
                  <Input id="accountNumber" name="accountNumber" value={bankForm.accountNumber} onChange={handleBankChange} placeholder="Nhập số tài khoản" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Chủ tài khoản</Label>
                  <Input id="accountHolder" name="accountHolder" value={bankForm.accountHolder} onChange={handleBankChange} placeholder="Họ và tên chủ tài khoản" />
                </div>
              </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting || !canSubmit}>
              <ArrowDownToLine className="size-4" />
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu rút xu"}
            </Button>
          </form>

          <div className="space-y-4 rounded-2xl border bg-muted/40 p-5 md:col-span-1">
            <div className="flex items-center gap-3">
              <Wallet className="size-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Hóa đơn rút xu</p>
                <p className="text-lg font-semibold">{formattedVnd} VND</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số xu trừ</span>
                <span className="font-medium">{formattedCoins} xu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tỉ giá</span>
                <span className="font-medium">10 xu = 800 VND</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số dư hiện có</span>
                <span className="font-medium">{(user.coins ?? 0).toLocaleString("vi-VN")} xu</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
              <Landmark className="mt-0.5 size-4" />
              <p>Bạn có thể cập nhật tài khoản đã lưu trong trang Profile.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
