"use client";

import { useState, useEffect, FormEvent } from "react";
import { API } from "@/lib/api";
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Switch,
  Separator,
} from "@/components/ui";
import { toast } from "@/lib/toast";
import { toastApiError } from "@/lib/errors";
import QuickEditorDialog from "./QuickEditorDialog";

interface Props {
  novelId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (chap: Record<string, unknown>) => void;
  onUpdated?: (chap: Record<string, unknown>) => void;
  initialChapterNumber?: number;
  mode?: "create" | "edit";
  initialTitle?: string;
  initialContent?: string;
  initialIsLocked?: boolean;
  chapterId?: string;
  trigger?: React.ReactNode;
}

export default function ChapterCreateDialog({
  novelId,
  open,
  onOpenChange,
  onCreated,
  onUpdated,
  initialChapterNumber,
  mode = "create",
  initialTitle,
  initialContent,
  initialIsLocked,
  chapterId,
  trigger,
}: Props) {
  const [localOpen, setLocalOpen] = useState<boolean>(false);
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState<string>("");

  const [isLocked, setIsLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  
  const handleOpenChange = (v: boolean) => {
    setLocalOpen(v);

    if (v) {
      const num = initialChapterNumber ?? 1;
      setChapterNumber(num);
      if (mode === "create") {
        setTitle(`Chương ${num}: `);
        setFile(null);
        setContent("");
      } else {
        // edit mode: avoid overwriting props-derived values here to prevent races
        if (typeof initialTitle !== "undefined") setTitle(initialTitle);
        // sync initial locked state when opening for edit
        if (typeof initialIsLocked !== "undefined") setIsLocked(Boolean(initialIsLocked));
        // keep existing file state (user may replace it)
      }
      
    }

    onOpenChange?.(v);
  };

  /** sync chapter number */
  useEffect(() => {
    if (typeof initialChapterNumber !== "undefined" && initialChapterNumber !== null) {
      setChapterNumber(initialChapterNumber);
    }
  }, [initialChapterNumber, open]);

  /** auto prefix title */
  useEffect(() => {
    setTitle((prev) => {
      const suffix = prev.replace(/^Chương\s+\d+\s*:\s*/i, "");
      return `Chương ${chapterNumber}: ${suffix}`;
    });
  }, [chapterNumber]);

  /** sync initial content when provided (edit mode) */
  useEffect(() => {
    if (mode === "edit") {
      if (typeof initialContent !== "undefined") setContent(initialContent || "");
      if (typeof initialTitle !== "undefined") setTitle(initialTitle || "");
      if (typeof initialIsLocked !== "undefined") setIsLocked(Boolean(initialIsLocked));
    }
  }, [initialContent, initialTitle, mode, initialIsLocked]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault?.();
    if (!novelId) return;

    if (!file && !content) {
      toast.error("Vui lòng chọn upload file hoặc soạn nhanh nội dung.");
      return;
    }

    try {
      setSubmitting(true);
      

      const form = new FormData();
      form.append("chapterNumber", String(chapterNumber));
      form.append("title", title);
      form.append("isLocked", isLocked ? "true" : "false");
      if (file) form.append("file", file);
      if (content) form.append("content", content);

      let res;
      if (mode === "edit" && chapterId) {
        res = await API.put(`/api/novels/${novelId}/chapters/${chapterId}`, form);
        onUpdated?.(res.data?.chapter || res.data);
      } else {
        res = await API.post(`/api/novels/${novelId}/chapters`, form);
        onCreated?.(res.data?.chapter || res.data);
      }
      const successMessage = res.data?.message || (mode === "edit" ? "Sửa chương thành công" : "Tạo chương thành công");
      toast.success(successMessage);
      handleOpenChange(false);
    } catch (err: unknown) {
      const defaultMsg = mode === "edit" ? "Sửa chương thất bại" : "Tạo chương thất bại";
      toastApiError(err, defaultMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const isOpen = open ?? localOpen;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm">+ Thêm chương</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Sửa chương" : "Thêm chương mới"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Chapter number + title */}
          <div className="flex gap-3">
            <div className="w-[6.5rem]">
              <Label>Số chương</Label>
              <Input
                type="number"
                className="mt-1"
                value={chapterNumber}
                onChange={(e) => setChapterNumber(Number(e.target.value))}
                disabled={mode === "edit"}
              />
            </div>

            <div className="flex-1">
              <Label>Tên chương</Label>
              <Input
                className="mt-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Lock */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Khoá chương</Label>
              <Switch
                checked={isLocked}
                onCheckedChange={setIsLocked}
              />
            </div>

              <p className="text-xs text-muted-foreground">
                Chương khoá sẽ có giá cố định{" "}
                <b>10 xu</b> cho mỗi lượt mở.
              </p>
          </div>

          <Separator />

          <p className="text-sm text-muted-foreground">
            Upload file nội dung
          </p>

          {/* Upload */}
          <label
            className={`block rounded-lg border border-dashed p-4 text-center cursor-pointer transition
              ${
                file
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/60 hover:bg-muted"
              }
            `}
          >
            <input
              type="file"
              className="hidden"
              accept="text/plain,text/html,.doc,.docx"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setContent("");
              }}
            />
            {file ? (
              <span className="text-sm font-medium">
                {file.name}
              </span>
            ) : (
              <span className="text-sm">
                Click để chọn file (.txt, .docx, .html)
              </span>
            )}
          </label>

          <p className="text-sm text-muted-foreground text-center">
            hoặc
          </p>

          {/* Quick editor */}
          <div className="flex justify-center">
            <QuickEditorDialog
              disabled={!!file}
              triggerLabel={mode === "edit" ? "Sửa nhanh" : undefined}
              initialContent={content}
              onSave={(html: string) => {
                setContent(html);
                setFile(null);
              }}
            />
          </div>

          

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? (mode === "edit" ? "Đang sửa..." : "Đang tạo...") : (mode === "edit" ? "Sửa chương" : "Tạo chương")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
