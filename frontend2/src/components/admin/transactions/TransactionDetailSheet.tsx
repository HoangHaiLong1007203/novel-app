"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Button, Label, Textarea } from "@/components/ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { resolveAdminTransaction, retryAdminTransaction } from "@/lib/api";
import { toastApiError } from "@/lib/errors";
import { toast } from "@/lib/toast";
import type { AdminTransactionItem, AdminTransactionStatus } from "@/types/adminTransactions";
import { TransactionStatusBadge } from "./TransactionStatusBadge";

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

type ResolveStatus = Extract<AdminTransactionStatus, "success" | "failed" | "canceled">;

interface TransactionDetailSheetProps {
  transaction?: AdminTransactionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionUpdate?: (transaction: AdminTransactionItem) => void;
  onActionCompleted?: () => void;
}

export function TransactionDetailSheet({ transaction, open, onOpenChange, onTransactionUpdate, onActionCompleted }: TransactionDetailSheetProps) {
  const [adminNote, setAdminNote] = useState("");
  const [resolveLoading, setResolveLoading] = useState<ResolveStatus | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setAdminNote("");
      setResolveLoading(null);
      setRetryLoading(false);
    } else {
      setAdminNote("");
    }
  }, [open, transaction?._id]);

  const canMarkSuccess = useMemo(() => {
    if (!transaction) return false;
    return transaction.type === "topup" && transaction.status !== "success";
  }, [transaction]);

  const canMarkFailed = useMemo(() => {
    if (!transaction) return false;
    return transaction.status !== "failed" && transaction.status !== "canceled";
  }, [transaction]);

  const canRetry = useMemo(() => {
    if (!transaction) return false;
    return transaction.provider === "stripe" && transaction.status !== "success";
  }, [transaction]);

  const handleResolve = async (target: ResolveStatus) => {
    if (!transaction) return;
    setResolveLoading(target);
    try {
      const response = await resolveAdminTransaction(transaction._id, {
        status: target,
        reason: adminNote.trim() || undefined,
      });
      if (response.transaction) {
        onTransactionUpdate?.(response.transaction);
      }
      toast.success(target === "success" ? "Đã đánh dấu giao dịch thành công" : "Đã cập nhật trạng thái giao dịch");
      onActionCompleted?.();
    } catch (error) {
      toastApiError(error, "Không thể cập nhật giao dịch");
    } finally {
      setResolveLoading(null);
    }
  };

  const handleRetry = async () => {
    if (!transaction) return;
    setRetryLoading(true);
    try {
      const response = await retryAdminTransaction(transaction._id);
      if (response.transaction) {
        onTransactionUpdate?.(response.transaction);
      }
      toast.success("Đã đồng bộ trạng thái với Stripe");
      onActionCompleted?.();
    } catch (error) {
      toastApiError(error, "Không thể đồng bộ giao dịch");
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-xl overflow-y-auto">
        {transaction ? (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Chi tiết giao dịch</SheetTitle>
              <SheetDescription>ID: {transaction._id}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-wrap items-center gap-4">
              <TransactionStatusBadge status={transaction.status} />
              <span className="text-sm text-muted-foreground">{new Date(transaction.createdAt).toLocaleString("vi-VN")}</span>
            </div>

            <DetailGrid
              items={[
                { label: "Người dùng", value: transaction.user?.username ?? "--" },
                { label: "Email", value: transaction.user?.email ?? "--" },
                { label: "Loại", value: transaction.type === "topup" ? "Nạp xu" : "Mua chương" },
                { label: "Số xu", value: `${transaction.amount.toLocaleString("vi-VN")} xu` },
                { label: "Số tiền", value: currencyFormatter.format(transaction.amountVnd ?? transaction.amount * 100) },
                { label: "Cổng", value: (transaction.provider || "--").toUpperCase() },
                { label: "Order code", value: transaction.orderCode ?? "--" },
                { label: "Mô tả", value: transaction.description ?? "--" },
                { label: "Lý do", value: transaction.statusReason ?? "--" },
              ]}
            />

            {transaction.type === "purchase" ? (
              <div className="space-y-2 rounded-xl border p-4">
                <p className="text-sm font-semibold">Thông tin chương</p>
                <p className="text-sm text-muted-foreground">Truyện: {transaction.novel?.title ?? "--"}</p>
                <p className="text-sm text-muted-foreground">
                  Chương: {transaction.chapter?.chapterNumber ?? "--"} - {transaction.chapter?.title ?? "--"}
                </p>
              </div>
            ) : null}

            <div className="space-y-2 rounded-xl border p-4">
              <p className="text-sm font-semibold">Hành động admin</p>
              <Label htmlFor="admin-note" className="text-xs uppercase text-muted-foreground">
                Ghi chú
              </Label>
              <Textarea
                id="admin-note"
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                placeholder="Thông tin hiển thị trong lịch sử giao dịch (tuỳ chọn)"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Ghi chú sẽ được lưu cùng trạng thái mới.</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleResolve("success")}
                  disabled={!canMarkSuccess || Boolean(resolveLoading) || retryLoading}
                >
                  {resolveLoading === "success" ? "Đang cập nhật..." : "Đánh dấu thành công"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleResolve("failed")}
                  disabled={!canMarkFailed || Boolean(resolveLoading) || retryLoading}
                >
                  {resolveLoading === "failed" ? "Đang cập nhật..." : "Đánh dấu thất bại"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleResolve("canceled")}
                  disabled={!canMarkFailed || Boolean(resolveLoading) || retryLoading}
                >
                  {resolveLoading === "canceled" ? "Đang cập nhật..." : "Huỷ giao dịch"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleRetry} disabled={!canRetry || retryLoading || Boolean(resolveLoading)}>
                  {retryLoading ? "Đồng bộ..." : "Đồng bộ Stripe"}
                </Button>
              </div>
            </div>

            {transaction.metadata ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Metadata</p>
                <pre className="max-h-48 overflow-auto rounded-xl bg-muted p-3 text-xs">
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">Chọn một giao dịch để xem chi tiết.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailGrid({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border p-3">
          <p className="text-xs uppercase text-muted-foreground">{item.label}</p>
          <p className="text-sm font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
