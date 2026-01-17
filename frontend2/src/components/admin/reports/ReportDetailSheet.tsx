"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@/components/ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { updateAdminReport } from "@/lib/api";
import { toastApiError } from "@/lib/errors";
import { toast } from "@/lib/toast";
import type { AdminReportItem, AdminReportPriority, AdminReportStatus } from "@/types/adminReports";
import { ReportPriorityBadge } from "./ReportPriorityBadge";
import { ReportStatusBadge } from "./ReportStatusBadge";

const DEFAULT_STATUS_OPTIONS: AdminReportStatus[] = ["pending", "reviewing", "resolved", "dismissed"];
const DEFAULT_PRIORITY_OPTIONS: AdminReportPriority[] = ["high", "medium", "low"];

const TARGET_LABELS: Record<AdminReportItem["targetType"], string> = {
  novel: "Truyện",
  chapter: "Chương",
  comment: "Bình luận",
  review: "Đánh giá",
  user: "Người dùng",
  system: "Hệ thống",
};

interface ReportDetailSheetProps {
  report?: AdminReportItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusOptions?: AdminReportStatus[];
  priorityOptions?: AdminReportPriority[];
  onReportUpdate?: (report: AdminReportItem) => void;
  onActionCompleted?: () => void;
}

export function ReportDetailSheet({
  report,
  open,
  onOpenChange,
  statusOptions,
  priorityOptions,
  onReportUpdate,
  onActionCompleted,
}: ReportDetailSheetProps) {
  const [statusState, setStatusState] = useState<AdminReportStatus>("pending");
  const [priorityState, setPriorityState] = useState<AdminReportPriority>("medium");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!report) return;
    setStatusState(report.status);
    setPriorityState(report.priority);
    setNote(report.resolutionNote ?? "");
  }, [report]);

  useEffect(() => {
    if (!open) {
      setSaving(false);
    }
  }, [open]);

  const statusOptionsResolved = statusOptions?.length ? statusOptions : DEFAULT_STATUS_OPTIONS;
  const priorityOptionsResolved = priorityOptions?.length ? priorityOptions : DEFAULT_PRIORITY_OPTIONS;

  const canSubmit = useMemo(() => {
    if (!report) return false;
    if (statusState !== report.status) return true;
    if (priorityState !== report.priority) return true;
    if ((note.trim() || "") !== (report.resolutionNote ?? "")) return true;
    return false;
  }, [note, priorityState, report, statusState]);

  const handleSubmit = async () => {
    if (!report || !canSubmit) return;
    setSaving(true);
    try {
      const payload: { status?: AdminReportStatus; priority?: AdminReportPriority; resolutionNote?: string } = {};
      if (statusState !== report.status) {
        payload.status = statusState;
      }
      if (priorityState !== report.priority) {
        payload.priority = priorityState;
      }
      const trimmedNote = note.trim();
      if (trimmedNote !== (report.resolutionNote ?? "")) {
        payload.resolutionNote = trimmedNote || undefined;
      }
      if (!Object.keys(payload).length) {
        setSaving(false);
        return;
      }
      const response = await updateAdminReport(report._id, payload);
      toast.success("Đã cập nhật báo cáo");
      if (response.report) {
        onReportUpdate?.(response.report);
      }
      onActionCompleted?.();
    } catch (error) {
      toastApiError(error, "Không thể cập nhật báo cáo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-2xl overflow-y-auto">
        {report ? (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Chi tiết báo cáo</SheetTitle>
              <SheetDescription>ID: {report._id}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <ReportStatusBadge status={report.status} />
              <ReportPriorityBadge priority={report.priority} />
              <span>{new Date(report.createdAt).toLocaleString("vi-VN")}</span>
            </div>

            <DetailGrid
              items={[
                { label: "Đối tượng", value: TARGET_LABELS[report.targetType] },
                { label: "Tiêu đề", value: report.targetTitle ?? "--" },
                { label: "Người báo cáo", value: report.reporter?.username ?? "Ẩn danh" },
                { label: "Email", value: report.reporter?.email ?? "--" },
                { label: "Danh mục", value: report.category },
                { label: "Độ ưu tiên", value: report.priority },
                { label: "Trạng thái", value: report.status },
                { label: "Gán cho", value: report.assignedTo?.username ?? "chưa gán" },
              ]}
            />

            <section className="space-y-2 rounded-xl border p-4">
              <p className="text-sm font-semibold">Nội dung báo cáo</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{report.reason}</p>
              {report.targetSnippet ? (
                <div className="rounded-lg bg-muted/60 p-3 text-xs">
                  <p className="font-semibold uppercase text-muted-foreground">Trích đoạn liên quan</p>
                  <p className="mt-1 whitespace-pre-line">{report.targetSnippet}</p>
                </div>
              ) : null}
            </section>

            {report.tags && report.tags.length ? (
              <section className="space-y-2">
                <p className="text-sm font-semibold">Thẻ</p>
                <div className="flex flex-wrap gap-2">
                  {report.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-3 rounded-xl border p-4">
              <p className="text-sm font-semibold">Hành động admin</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs uppercase text-muted-foreground">Trạng thái</Label>
                  <Select value={statusState} onValueChange={(value: AdminReportStatus) => setStatusState(value)} disabled={saving}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptionsResolved.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs uppercase text-muted-foreground">Độ ưu tiên</Label>
                  <Select value={priorityState} onValueChange={(value: AdminReportPriority) => setPriorityState(value)} disabled={saving}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptionsResolved.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="report-note" className="text-xs uppercase text-muted-foreground">
                  Ghi chú giải quyết
                </Label>
                <Textarea
                  id="report-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Lưu lại quyết định hoặc hướng xử lý"
                  disabled={saving}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </section>

            {report.metadata ? (
              <section className="space-y-2">
                <p className="text-sm font-semibold">Metadata</p>
                <pre className="max-h-48 overflow-auto rounded-xl bg-muted p-3 text-xs">
                  {JSON.stringify(report.metadata, null, 2)}
                </pre>
              </section>
            ) : null}

            {report.notes && report.notes.length ? (
              <section className="space-y-2">
                <p className="text-sm font-semibold">Ghi chú</p>
                <div className="space-y-2">
                  {report.notes.map((noteItem, idx) => (
                    <div key={`${report._id}-note-${idx}`} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        {noteItem.author?.username ?? "Admin"} • {noteItem.createdAt ? new Date(noteItem.createdAt).toLocaleString("vi-VN") : "--"}
                      </p>
                      <p className="text-sm">{noteItem.message ?? "--"}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">Chọn một báo cáo để xem chi tiết.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailGrid({ items }: { items: Array<{ label: string; value: string }> }) {
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
