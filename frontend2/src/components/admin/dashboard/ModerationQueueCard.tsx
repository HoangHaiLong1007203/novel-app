"use client";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { ModerationQueueItem } from "@/types/adminDashboard";

interface ModerationQueueCardProps {
  items: ModerationQueueItem[];
}

const statusMap: Record<ModerationQueueItem["status"], { label: string; variant: string }> = {
  pending: { label: "Chờ duyệt", variant: "bg-amber-100 text-amber-800" },
  escalated: { label: "Cần xử lý", variant: "bg-red-100 text-red-800" },
  snoozed: { label: "Đã hoãn", variant: "bg-slate-100 text-slate-700" },
};

export default function ModerationQueueCard({ items }: ModerationQueueCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hàng chờ kiểm duyệt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">Tác giả: {item.author}</p>
              </div>
              <Badge className={statusMap[item.status].variant}>{statusMap[item.status].label}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline">
                Xem trước
              </Button>
              <Button size="sm">Duyệt</Button>
              <Button size="sm" variant="ghost">
                Gửi lại sau
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Báo cáo lúc {item.reportedAt}</p>
          </div>
        ))}
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Không có nội dung nào cần duyệt.</p> : null}
      </CardContent>
    </Card>
  );
}
