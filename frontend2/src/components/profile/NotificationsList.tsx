import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";
import { Button } from "@/components/ui";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";
import { Badge } from "@/components/ui";

type Notification = {
  _id: string;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
  relatedNovel?: { title?: string } | null;
  relatedChapter?: { title?: string; chapterNumber?: number } | null;
};

export function NotificationsList() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const data = await fetchNotifications(p, 20);
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((it) => (it._id === id ? { ...it, isRead: true } : it)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông báo</CardTitle>
        <CardDescription>Danh sách thông báo của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">Có <strong>{unreadCount}</strong> thông báo chưa đọc</div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => load()}>Tải lại</Button>
            <Button size="sm" onClick={handleMarkAll}>Đánh dấu tất cả đã đọc</Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-10 w-full rounded-md bg-muted" />
            <div className="h-10 w-full rounded-md bg-muted" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Không có thông báo</div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((n) => (
              <div key={n._id} className={`flex items-start justify-between gap-3 rounded-md border p-3 ${n.isRead ? "opacity-70" : ""}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{n.title ?? "Thông báo"}</div>
                    {n.type ? <Badge variant="secondary">{n.type}</Badge> : null}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{n.message}</div>
                  <div className="text-xs text-muted-foreground mt-2">{n.relatedNovel?.title ?? n.relatedChapter?.title ?? new Date(n.createdAt || "").toLocaleString("vi-VN")}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {!n.isRead ? (
                    <Button size="sm" variant="outline" onClick={() => handleMarkRead(n._id)}>Đánh dấu đã đọc</Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter />
    </Card>
  );
}

export default NotificationsList;
