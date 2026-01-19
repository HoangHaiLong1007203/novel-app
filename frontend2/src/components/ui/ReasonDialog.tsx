"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Textarea } from "@/components/ui";

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (reason: string) => void | Promise<void>;
}

export default function ReasonDialog({
  open,
  onOpenChange,
  title = "Xác nhận",
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason("");
      setSubmitting(false);
    }
  }, [open]);

  const canSubmit = useMemo(() => !submitting, [submitting]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <Textarea
          placeholder="Nhập lý do (không bắt buộc)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            {cancelText}
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {submitting ? "Đang xử lý..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
