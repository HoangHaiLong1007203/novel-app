"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { ActivityItem } from "@/types/adminDashboard";
import { BookOpen, Flag, RefreshCw, User } from "lucide-react";
import type { ReactNode } from "react";

interface ActivityFeedProps {
  items: ActivityItem[];
}

const iconMap: Record<ActivityItem["type"], ReactNode> = {
  novel: <BookOpen className="size-4 text-primary" />,
  user: <User className="size-4 text-primary" />,
  payment: <RefreshCw className="size-4 text-primary" />,
  report: <Flag className="size-4 text-primary" />,
};

export default function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-lg border p-3">
            <div className="mt-1">{iconMap[item.type]}</div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                <span className="text-primary">{item.actor}</span> {item.action}
                {item.target ? <span className="font-semibold"> {item.target}</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">{item.timeAgo}</p>
            </div>
            {item.highlight ? <Badge className="self-start">Mới</Badge> : null}
          </div>
        ))}
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có hoạt động nào.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
