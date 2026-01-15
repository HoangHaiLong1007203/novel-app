import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui";
import { fetchUserTransactions } from "@/lib/api";
import { Pagination, PaginationContent, PaginationLink, PaginationItem } from "@/components/ui/pagination";

export type TransactionItem = {
  _id: string;
  type: "topup" | "purchase";
  provider?: "stripe" | "vnpay" | null;
  status: string;
  amount: number;
  amountVnd?: number;
  orderCode?: string;
  createdAt: string;
  novel?: { title?: string } | null;
  chapter?: { title?: string; chapterNumber?: number } | null;
};

export function TransactionsList({ type }: { type?: "topup" | "purchase" }) {
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
        <CardTitle>{type === "purchase" ? "Lịch sử mở khóa" : "Lịch sử nạp"}</CardTitle>
        <CardDescription>{type === "purchase" ? "Các chương bạn đã mở khóa" : "Các giao dịch nạp xu của bạn"}</CardDescription>
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
            {items.map((t) => (
              <div key={t._id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex flex-col">
                  <div className="font-medium">
                    {t.type === "topup" ? `Nạp ${t.amount.toLocaleString("vi-VN")} xu` : `Mua chương ${t.chapter?.chapterNumber ?? ""} — ${t.novel?.title ?? ""}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(t.createdAt).toLocaleString("vi-VN")}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">{t.type === "topup" ? `${t.amount.toLocaleString("vi-VN")} xu` : `${t.amount.toLocaleString("vi-VN")} xu`}</div>
                  <div className="text-xs text-muted-foreground">{t.status}</div>
                </div>
              </div>
            ))}
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
