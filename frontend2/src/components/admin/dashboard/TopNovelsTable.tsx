"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { TopNovelItem } from "@/types/adminDashboard";

interface TopNovelsTableProps {
  items: TopNovelItem[];
}

export default function TopNovelsTable({ items }: TopNovelsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top truyện theo doanh thu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 text-xs uppercase text-muted-foreground">
          <span>Truyện</span>
          <span>Poster</span>
          <span>Doanh thu</span>
          <span>Đánh giá</span>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-3 rounded-lg border p-3 text-sm">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{item.status}</p>
              </div>
              <p>{item.poster}</p>
              <p className="font-semibold">{item.revenue.toLocaleString("vi-VN")} ₫</p>
              <Badge variant="secondary">{item.reviews} review</Badge>
            </div>
          ))}
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
