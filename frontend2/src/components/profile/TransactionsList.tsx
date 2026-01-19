import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui";
import { TransactionStatusBadge } from "@/components/admin/transactions/TransactionStatusBadge";
import { fetchUserTransactions } from "@/lib/api";
import { Pagination, PaginationContent, PaginationLink, PaginationItem } from "@/components/ui/pagination";

export type TransactionItem = {
  _id: string;
  type: "topup" | "purchase" | "gift";
  provider?: "stripe" | "vnpay" | null;
  status: string;
  amount: number;
  amountVnd?: number;
  orderCode?: string;
  createdAt: string;
  novel?: { title?: string } | null;
  chapter?: { title?: string; chapterNumber?: number } | null;
  direction?: "credit" | "debit";
  metadata?: Record<string, unknown> | null;
};

export function TransactionsList({ type }: { type?: "topup" | "purchase" | "gift" }) {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchUserTransactions(page, 20, type)
      .then((data) => {
        setItems(data.transactions || []);
        setTotalPages(data.pagination?.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, type]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{type === "purchase" ? "Lịch sử mở khóa" : "Lịch sử giao dịch"}</CardTitle>
        <CardDescription>
          {type === "purchase" ? "Các chương bạn đã mở khóa" : "Các giao dịch nạp xu và tặng quà của bạn"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-10 w-full rounded-md bg-muted" />
            <div className="h-10 w-full rounded-md bg-muted" />
            <div className="h-10 w-full rounded-md bg-muted" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Không có lịch sử</div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((t) => {
              const amountText = `${t.amount.toLocaleString("vi-VN")} xu`;
              const isGift = t.type === "gift";
              const isCredit = t.direction
                ? t.direction === "credit"
                : t.type === "topup";
              const sign = t.type === "topup" || (t.type !== "purchase" && isGift && isCredit)
                ? "+"
                : t.type === "purchase" && t.direction === "credit"
                ? "+"
                : t.type === "purchase" || (isGift && !isCredit)
                ? "-"
                : "";
              const meta = (t.metadata || {}) as { fromUsername?: string; toUsername?: string };
              const novelTitle = t.novel?.title ?? "";
              const novelSuffix = novelTitle ? ` cho truyện ${novelTitle}` : "";

              let title = "";
              if (t.type === "topup") {
                title = `Nạp ${amountText}`;
              } else if (t.type === "purchase") {
                const chapterLabel = t.chapter?.chapterNumber ? `chương ${t.chapter.chapterNumber}` : "chương";
                title = t.direction === "credit"
                  ? `Nhận ${amountText} từ ${meta.fromUsername ?? "độc giả"} cho ${chapterLabel} — ${novelTitle}`
                  : `Mua ${chapterLabel} — ${novelTitle}`;
              } else {
                title = isCredit
                  ? `Nhận ${amountText} từ ${meta.fromUsername ?? "độc giả"}${novelSuffix}`
                  : `Tặng ${amountText}${novelSuffix}`;
              }

              return (
                <div key={t._id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex flex-col">
                    <div className="font-medium">{title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(t.createdAt).toLocaleString("vi-VN")}</div>
                  </div>
                  <div className="text-right text-sm flex flex-col items-end gap-2">
                    <div className="font-semibold">{sign}{amountText}</div>
                    <TransactionStatusBadge status={t.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 py-1">{page} / {totalPages}</span>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  );
}

export default TransactionsList;
