"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API, fetchReaderSettings } from "@/lib/api";
import ChapterHeader from "@/components/novel/ChapterHeader";
import ChapterFooterActions from "@/components/novel/ChapterFooterActions";
import ChapterReader from "@/components/novel/ChapterReader";
import SettingsUI from "@/components/settings/settingsUI";
import { ReaderSettingsPayload } from "@/lib/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Chapter {
  _id: string;
  chapterNumber: number;
  title: string;
  content: string;
  novel: {
    _id: string;
    title: string;
  };
}

export default function ChapterPage() {
  const { id, chapterId } = useParams();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const [chaptersList, setChaptersList] = useState<Chapter[]>([]);
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [readerSettings, setReaderSettings] = useState<ReaderSettingsPayload>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dialogWidth, setDialogWidth] = useState<number | null>(null);

  const localKey = "novel-app-reader-settings";

  // Load reader settings on page load: prefer server settings when logged in, otherwise use localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (typeof window === "undefined") return;
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
          try {
            const server = await fetchReaderSettings().catch(() => null);
            if (server) {
              setReaderSettings(server);
              // also cache locally
              localStorage.setItem(localKey, JSON.stringify(server));
              return;
            }
          } catch {
            // ignore and fallback to local
          }
        }

        const cached = localStorage.getItem(localKey);
        if (cached) {
          try {
            setReaderSettings(JSON.parse(cached));
          } catch (e) {
            console.error("Failed to parse cached reader settings", e);
          }
        }
      } catch (err) {
        console.error("Error loading reader settings:", err);
      }
    };

    loadSettings();
    // only run once on mount
  }, []);

  useEffect(() => {
      if (!chapterId) return;
      const fetchData = async () => {
        try {
          const res = await API.get(`/api/novels/${id}/chapters/${chapterId}`);
          const ch = res.data?.chapter || null;
          setChapter(ch);

          // load all chapters to determine prev/next
          try {
            const listRes = await API.get(`/api/novels/${id}/chapters?sort=asc`);
            const list: Chapter[] = listRes.data?.chapters || [];
            setChaptersList(list);
            const idx = list.findIndex((c) => c._id === chapterId);
            if (idx > -1) {
              setHasPrev(idx > 0);
              setHasNext(idx < list.length - 1);
              setPrevId(idx > 0 ? list[idx - 1]._id : null);
              setNextId(idx < list.length - 1 ? list[idx + 1]._id : null);
            } else {
              setHasPrev(false);
              setHasNext(false);
              setPrevId(null);
              setNextId(null);
            }
          } catch {
            setHasPrev(false);
            setHasNext(false);
          }
        } catch (err) {
          console.error("Không thể tải chương:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [id, chapterId]);

  // Scroll to top when switching to a different chapter
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Use instant scroll to avoid visual jump during navigation timing
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [chapterId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setDialogWidth(Math.floor(el.getBoundingClientRect().width));

    // initial measure
    update();

    // Use ResizeObserver when available to react to layout changes immediately
        let ro: ResizeObserver | null = null;
        if (typeof window !== "undefined") {
          const RO = (window as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
          if (RO) {
            const observer = new RO(() => {
              update();
            });
            ro = observer;
            observer.observe(el);
          }
        }

    // Also listen to window resize as a fallback
    const onWin = () => update();
    window.addEventListener("resize", onWin);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, [containerRef, showSettings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Đang tải chương...</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Không tìm thấy chương.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-0">
      <ChapterHeader
        novelTitle={chapter.novel?.title || ""}
        author={""}
        chapterTitle={`Chương ${chapter.chapterNumber}: ${chapter.title}`}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => prevId && router.push(`/novels/${id}/chapters/${prevId}`)}
        onNext={() => nextId && router.push(`/novels/${id}/chapters/${nextId}`)}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings((s) => !s)}
        readerSettings={readerSettings}
        chapters={chaptersList}
        novelId={typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined}
      />

      <Dialog open={showSettings} onOpenChange={(open) => setShowSettings(open)}>
        {showSettings && (
          <DialogContent fitContent style={dialogWidth ? { width: `${dialogWidth}px` } : undefined}>
            <SettingsUI onChange={(s) => setReaderSettings(s)} onClose={() => setShowSettings(false)} />
          </DialogContent>
        )}
      </Dialog>

      <div className="p-6" style={{ background: readerSettings.backgroundColor || undefined }} ref={containerRef}>
        <ChapterReader chapterId={chapterId as string} readerSettings={readerSettings} />
      </div>

      {/* measure container width for dialog sizing */}
      <script suppressHydrationWarning>
        {""}
      </script>

      <ChapterFooterActions
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => prevId && router.push(`/novels/${id}/chapters/${prevId}`)}
        onNext={() => nextId && router.push(`/novels/${id}/chapters/${nextId}`)}
        readerSettings={readerSettings}
      />
    </div>
  );
}
