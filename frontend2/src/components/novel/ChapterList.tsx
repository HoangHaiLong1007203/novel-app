"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import ChapterItem, { NumberAvatar } from "@/components/novel/ChapterItem";
import ChapterCreateDialog from "@/components/novel/ChapterCreateDialog";
import { API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm/ConfirmProvider";
import { toast } from "@/lib/toast";
import { toastApiError } from "@/lib/errors";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

type Mode = "read" | "modify";

interface Chapter {
  _id: string;
  chapterNumber?: number;
  title?: string;
  createdAt?: string;
  isLocked?: boolean;
}

interface Props {
  chapters: Chapter[];
  mode?: Mode;
  novelId?: string;
  initialAsc?: boolean;
  onChangeChapters?: (next: Chapter[]) => void; // called when create adds
}

export default function ChapterList({ chapters, mode = "read", novelId, initialAsc = true, onChangeChapters }: Props) {
  const [asc, setAsc] = useState<boolean>(initialAsc);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<(Chapter & { content?: string }) | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const confirm = useConfirm();
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const pathname = typeof window !== "undefined" ? window.location.pathname : null;

  useEffect(() => {
    if (mode === "modify") {
      setActiveChapterId(null);
      return;
    }

    let mounted = true;

    // If we're inside a chapter page URL, derive current chapter id from path
    if (pathname && pathname.includes("/chapters/")) {
      const parts = pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1] || null;
      if (mounted) setActiveChapterId(last);
      return () => {
        mounted = false;
      };
    }

    // Otherwise, try to fetch reading progress (if novelId provided) to get last-read chapter
    if (!novelId) {
      setActiveChapterId(null);
      return;
    }

    (async () => {
      try {
        const rpRes = await API.get(`/api/reading-progress/${encodeURIComponent(novelId)}`);
        if (!mounted) return;
        const rp = rpRes.data?.readingProgress;
        const sessionLast = rp?.readingSessions?.length ? rp.readingSessions[rp.readingSessions.length - 1]?.chapter : null;
        const readChLast = rp?.readChapters?.length ? (rp.readChapters[rp.readChapters.length - 1]._id || rp.readChapters[rp.readChapters.length - 1]) : null;
        const lastId = sessionLast?.toString() || readChLast?.toString() || null;
        if (mounted) setActiveChapterId(lastId);
      } catch {
        if (mounted) setActiveChapterId(null);
      }
    })();

    return () => { mounted = false };
  }, [pathname, novelId, mode]);

  const sorted = useMemo(() => {
    return asc
      ? [...chapters].sort((a, b) => (Number(a.chapterNumber ?? 0) - Number(b.chapterNumber ?? 0)))
      : [...chapters].sort((a, b) => (Number(b.chapterNumber ?? 0) - Number(a.chapterNumber ?? 0)));
  }, [chapters, asc]);

  const nextChapterNumber = useMemo(() => {
    const nums = chapters.map((c) => Number(c.chapterNumber ?? 0)).filter((n) => !Number.isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return max + 1;
  }, [chapters]);

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Danh sách chương</h3>
        <div className="flex items-center gap-2">
          {mode === "modify" && (
            <ChapterCreateDialog
              novelId={novelId}
              initialChapterNumber={nextChapterNumber}
              trigger={<Button size="sm" variant="ghost" className="bg-white text-black">+</Button>}
              onCreated={(c: unknown) => {
                  const newCh = c as Chapter;
                  if (onChangeChapters) {
                    onChangeChapters([...chapters, newCh]);
                  }
                }}
            />
          )}

          <button
            aria-label="Đổi thứ tự chương"
            title={asc ? "Sắp xếp: Tăng dần" : "Sắp xếp: Giảm dần"}
            onClick={() => setAsc((s) => !s)}
            className="bg-white/10 p-2 rounded-md hover:bg-white/20 transition flex items-center justify-center"
          >
            <ArrowUpDown size={16} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Edit dialog (controlled) */}
          {editing && (
        <ChapterCreateDialog
          mode="edit"
          novelId={novelId}
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setEditing(null);
          }}
          chapterId={editing._id}
          initialChapterNumber={editing.chapterNumber}
              initialTitle={editing.title}
              initialContent={editing?.content}
          initialIsLocked={editing.isLocked}
          onUpdated={(c: unknown) => {
            const updated = c as Chapter;
            const next = chapters.map((x) => (x._id === updated._id ? updated : x));
            onChangeChapters?.(next);
          }}
          trigger={<span className="hidden" />}
        />
      )}

      <div>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {sorted.length > 0 ? (
            sorted.map((ch: Chapter) => {
              if (mode === "read") {
                return (
                  <ChapterItem
                      key={ch._id}
                      chapter={{ _id: ch._id, chapterNumber: Number(ch.chapterNumber ?? 0), title: ch.title || "", isLocked: ch.isLocked }}
                      isActive={Boolean(activeChapterId && activeChapterId === ch._id)}
                    />
                );
              }

              // modify mode: render row with menu
              return (
                <Card key={ch._id} className="mb-2 py-0 bg-background/80 hover:shadow-md transition-shadow">
                  <CardContent className="flex gap-3 items-center py-2 px-2">
                          {/** clickable area: avatar + text */}
                          <Link
                            href={novelId ? `/novels/${novelId}/chapters/${ch._id}` : `/#`}
                            className="flex-1 min-w-0 flex items-center gap-3 no-underline"
                          >
                            <NumberAvatar number={ch.chapterNumber} isLocked={ch.isLocked} />
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate" title={ch.title}>{ch.title}</div>
                              {ch.createdAt && <div className="text-xs opacity-60 mt-1">{new Date(ch.createdAt).toLocaleString()}</div>}
                            </div>
                          </Link>

                          <div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded-md hover:bg-white/5">
                                  <MoreVertical size={18} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={async () => {
                                                    try {
                                                    // first get chapter meta
                                                    const res = await API.get(`/api/novels/${novelId}/chapters/${ch._id}`);
                                                    const chapter = res.data?.chapter || res.data;

                                                    // then request access info which may include inline html or a url
                                                    let htmlContent: string | undefined;
                                                    try {
                                                      const accessRes = await API.get(`/api/chapters/${ch._id}/access`);
                                                      const access = accessRes.data || {};
                                                      if (access.html) {
                                                        htmlContent = access.html;
                                                      } else if (access.htmlUrl) {
                                                        // fetch the html from the returned URL
                                                        try {
                                                          const fetched = await fetch(access.htmlUrl);
                                                          if (fetched.ok) {
                                                            htmlContent = await fetched.text();
                                                          }
                                                        } catch (fetchErr) {
                                                          console.warn("Failed to fetch chapter html from url", fetchErr);
                                                        }
                                                      }
                                                    } catch (accessErr) {
                                                      console.warn("Failed to get chapter access", accessErr);
                                                    }

                                                    const newEditing: Chapter & { content?: string } = {
                                                      _id: ch._id,
                                                      chapterNumber: ch.chapterNumber,
                                                      title: chapter.title || ch.title,
                                                      createdAt: chapter.createdAt,
                                                      isLocked: typeof chapter.isLocked !== "undefined" ? Boolean(chapter.isLocked) : Boolean(ch.isLocked),
                                                      ...(htmlContent ? { content: htmlContent } : {}),
                                                    } as Chapter & { content?: string };
                                                    setEditing(newEditing);
                                                    setEditOpen(true);
                                                  } catch (err) {
                                                    toastApiError(err, "Không thể tải chương để sửa");
                                                    console.error("Failed to load chapter for edit", err);
                                                    setEditing({ _id: ch._id, chapterNumber: ch.chapterNumber, title: ch.title, createdAt: ch.createdAt, isLocked: ch.isLocked });
                                                    setEditOpen(true);
                                                  }
                                                }}>
                                                  <Edit2 size={14} className="mr-2" /> Sửa chương
                                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={async () => {
                                    if (!novelId) {
                                      toast.error("Không có novelId");
                                      return;
                                    }
                                    try {
                                      const confirmed = await confirm({
                                        title: "Xác nhận xóa chương",
                                        description: "Bạn có chắc muốn xóa chương này? Hành động không thể hoàn tác.",
                                        confirmText: "Xóa",
                                        cancelText: "Hủy",
                                        destructive: true,
                                      });
                                      if (!confirmed) return;
                                    } catch {
                                      return;
                                    }
                                    try {
                                      setDeletingId(ch._id);
                                      await API.delete(`/api/novels/${encodeURIComponent(novelId)}/chapters/${encodeURIComponent(ch._id)}`);
                                      onChangeChapters?.(chapters.filter((c) => c._id !== ch._id));
                                      toast.success("Đã xóa chương");
                                    } catch (e) {
                                      toastApiError(e, "Xóa chương thất bại");
                                      console.error("Failed to delete chapter", e);
                                    } finally {
                                      setDeletingId(null);
                                    }
                                  }}
                                >
                                  {deletingId === ch._id ? (
                                    <span>Đang xóa...</span>
                                  ) : (
                                    <>
                                      <Trash2 size={14} className="mr-2" /> Xóa chương
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-sm opacity-80">Chưa có chương nào.</div>
          )}
        </div>
      </div>
    </div>
  );
}
