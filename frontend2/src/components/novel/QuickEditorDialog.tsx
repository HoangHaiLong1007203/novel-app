"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { toast } from "@/lib/toast";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
  disabled?: boolean;
  onSave: (html: string) => void;
  initialContent?: string;
  triggerLabel?: string;
}

const DRAFT_KEY = "chapter-quick-editor-draft";

export default function QuickEditorDialog({ disabled, onSave, initialContent, triggerLabel }: Props) {
  const [open, setOpen] = useState(false);
  const lastSavedRef = useRef<string>("");

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: "",
    immediatelyRender: false,
  });

  /** Restore draft when open, or use provided initialContent for edit */
  useEffect(() => {
    if (open && editor) {
      if (typeof initialContent !== "undefined" && initialContent !== null) {
        editor.commands.setContent(initialContent);
        lastSavedRef.current = initialContent;
      } else {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          editor.commands.setContent(draft);
          lastSavedRef.current = draft;
        }
      }
      setTimeout(() => editor.commands.focus("end"), 0);
    }
  }, [open, editor, initialContent]);

  /** Autosave every 3s */
  useEffect(() => {
    if (!editor) return;

    const interval = setInterval(() => {
      const html = editor.getHTML();
      if (html !== lastSavedRef.current) {
        localStorage.setItem(DRAFT_KEY, html);
        lastSavedRef.current = html;
        // toast("Đã lưu nháp", { duration: 1200 });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [editor]);

  /** Detect unsaved change */
  const hasUnsaved = () => {
    if (!editor) return false;
    return editor.getHTML() !== lastSavedRef.current;
  };

  const handleSave = () => {
    if (!editor) return;

    const html = editor.getHTML();
    onSave(html);

    localStorage.removeItem(DRAFT_KEY);
    lastSavedRef.current = html;

    toast.success("Đã lưu nội dung chương");
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && hasUnsaved()) {
          const ok = confirm(
            "Nội dung chưa được lưu. Bạn có chắc muốn đóng không?"
          );
          if (!ok) return;
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}>
          {triggerLabel ?? "Soạn nhanh nội dung"}
        </Button>
      </DialogTrigger>

      <DialogContent className="!max-w-5xl">
        <DialogHeader>
          <DialogTitle>Soạn nội dung chương</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        {editor && (
          <div className="flex gap-1 border-b pb-2 mb-3">
            <Button
              size="sm"
              variant={editor.isActive("bold") ? "default" : "outline"}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              B
            </Button>
            <Button
              size="sm"
              variant={editor.isActive("italic") ? "default" : "outline"}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              I
            </Button>
            <Button
              size="sm"
              variant={editor.isActive("underline") ? "default" : "outline"}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              U
            </Button>

            <Separator orientation="vertical" className="mx-2 h-6" />

            <Button size="sm" onClick={() => editor.chain().focus().undo().run()}>
              Undo
            </Button>
            <Button size="sm" onClick={() => editor.chain().focus().redo().run()}>
              Redo
            </Button>
          </div>
        )}

        {/* Editor */}
        <div
          className="
            border rounded-md p-3
            min-h-[240px] max-h-[300px]
            overflow-y-auto
            prose prose-sm max-w-none
            text-justify leading-relaxed
          "
        >
          <EditorContent editor={editor} />
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={handleSave}>Lưu nội dung</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
