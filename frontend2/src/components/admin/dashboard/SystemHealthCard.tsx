"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { SystemHealthItem } from "@/types/adminDashboard";
import { AlertCircle, CheckCircle2, TriangleAlert } from "lucide-react";

interface SystemHealthCardProps {
  items: SystemHealthItem[];
}

const iconMap = {
  ok: <CheckCircle2 className="size-4 text-emerald-600" />,
  warn: <TriangleAlert className="size-4 text-amber-500" />,
  error: <AlertCircle className="size-4 text-red-600" />,
};

export default function SystemHealthCard({ items }: SystemHealthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trạng thái hệ thống</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              {iconMap[item.status]}
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.message}</p>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {item.status === "ok" ? "ổn định" : item.status === "warn" ? "cảnh báo" : "lỗi"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
