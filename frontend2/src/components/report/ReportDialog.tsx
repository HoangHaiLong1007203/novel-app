"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Textarea } from "@/components/ui";
import { createReport, type ReportTargetType } from "@/lib/api";
import { toast } from "@/lib/toast";
import { toastApiError } from "@/lib/errors";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType?: ReportTargetType;
  targetId?: string | null;
  targetTitle?: string | null;
  targetSnippet?: string | null;
  onSubmitted?: () => void;
}

export default function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetTitle,
  targetSnippet,
  onSubmitted,
}: ReportDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason("");
      setSubmitting(false);
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    return Boolean(targetType && targetId && reason.trim().length > 0 && !submitting);
  }, [reason, submitting, targetId, targetType]);

  const handleSubmit = async () => {
    if (!targetType || !targetId) return;
    const trimmed = reason.trim();
    if (!trimmed.length) {
      toast.error("Vui lòng nhập lý do báo cáo");
      return;
    }
    setSubmitting(true);
    try {
      await createReport({
        targetType,
        targetId,
        reason: trimmed,
        targetTitle: targetTitle ?? undefined,
        targetSnippet: targetSnippet ?? undefined,
      });
      toast.success("Đã gửi báo cáo");
      onSubmitted?.();
      onOpenChange(false);
    } catch (error) {
      toastApiError(error, "Không thể gửi báo cáo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gửi báo cáo</DialogTitle>
          <DialogDescription>
            {targetTitle ? `Đối tượng: ${targetTitle}` : "Vui lòng nhập lý do báo cáo."}
          </DialogDescription>
        </DialogHeader>
        {targetSnippet ? (
          <div className="rounded-md bg-muted/60 p-3 text-xs whitespace-pre-line">
            {targetSnippet}
          </div>
        ) : null}
        <Textarea
          placeholder="Nhập lý do..."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? "Đang gửi..." : "Gửi báo cáo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
