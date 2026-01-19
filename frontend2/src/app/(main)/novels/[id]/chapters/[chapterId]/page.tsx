"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API, fetchReaderSettings, markChapterAsRead, getNominationStatus, nominateNovel, giftChapter } from "@/lib/api";
import ChapterHeader from "@/components/novel/ChapterHeader";
import ChapterFooterActions from "@/components/novel/ChapterFooterActions";
import ChapterReader from "@/components/novel/ChapterReader";
import SettingsUI from "@/components/settings/settingsUI";
import { ReaderSettingsPayload } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReportDialog from "@/components/report/ReportDialog";
import { toast } from "@/lib/toast";
import { useAuth } from "@/hook/useAuth";
import { toastApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const NOMINATION_DAILY_LIMIT_DISPLAY = 5;

export default function ChapterPage() {
  const { id, chapterId } = useParams();
  const { user, setUser } = useAuth();
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
  const normalizedNovelId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  const normalizedChapterId = typeof chapterId === "string" ? chapterId : Array.isArray(chapterId) ? chapterId[0] : "";
  const sessionStartRef = useRef<number | null>(null);
  const sessionSubmittedRef = useRef(false);
  const readableRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dialogWidth, setDialogWidth] = useState<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [nominateOpen, setNominateOpen] = useState(false);
  const [nominationStatus, setNominationStatus] = useState<{
    limit: number;
    usedToday: number;
    remaining: number;
    nominationCount?: number;
  } | null>(null);
  const [nominateCount, setNominateCount] = useState(1);
  const [nominateLoading, setNominateLoading] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftCoins, setGiftCoins] = useState(10);
  const [giftLoading, setGiftLoading] = useState(false);

  const localKey = "novel-app-reader-settings";

  const flushReadingSession = useCallback(async () => {
    if (sessionSubmittedRef.current) return;
    if (!normalizedNovelId || !normalizedChapterId || !sessionStartRef.current) return;
    if (!readableRef.current) {
      sessionSubmittedRef.current = true;
      return;
    }
    if (typeof window === "undefined") return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken || accessToken === "undefined" || accessToken === "null") {
      sessionSubmittedRef.current = true;
      return;
    }

    sessionSubmittedRef.current = true;
    const finishedAt = Date.now();
    const payload = {
      novelId: normalizedNovelId,
      chapterId: normalizedChapterId,
      startedAt: new Date(sessionStartRef.current).toISOString(),
      completedAt: new Date(finishedAt).toISOString(),
      timeSpent: Math.max(0, Math.round((finishedAt - sessionStartRef.current) / 60000)),
    };

    try {
      await markChapterAsRead(payload);
    } catch (err) {
      console.error("Không thể cập nhật tiến trình đọc:", err);
    }
  }, [normalizedNovelId, normalizedChapterId]);

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

  useEffect(() => {
    if (!normalizedChapterId) return;
    sessionStartRef.current = Date.now();
    sessionSubmittedRef.current = false;
    return () => {
      void flushReadingSession();
    };
  }, [normalizedChapterId, flushReadingSession]);

  // Scroll to top when switching to a different chapter
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Use instant scroll to avoid visual jump during navigation timing
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [chapterId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVisibility = () => {
      if (document.hidden) {
        void flushReadingSession();
      }
    };

    const handlePageHide = () => {
      void flushReadingSession();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [flushReadingSession]);

  // receive readable updates from ChapterReader
  const handleReadable = useCallback((readable: boolean) => {
    readableRef.current = Boolean(readable);
  }, []);

  const handleReport = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để báo cáo");
      return;
    }
    setReportOpen(true);
  };

  const loadNominationStatus = useCallback(async () => {
    if (!normalizedNovelId || !user) return;
    try {
      const status = await getNominationStatus(normalizedNovelId);
      setNominationStatus(status);
    } catch (err) {
      toastApiError(err, "Không thể tải trạng thái đề cử");
    }
  }, [normalizedNovelId, user]);

  useEffect(() => {
    if (!nominateOpen) return;
    void loadNominationStatus();
  }, [nominateOpen, loadNominationStatus]);

  useEffect(() => {
    if (!nominationStatus) return;
    const remaining = nominationStatus.remaining ?? 0;
    if (remaining <= 0) {
      setNominateCount(0);
      return;
    }
    setNominateCount((prev) => Math.min(Math.max(1, prev), remaining));
  }, [nominationStatus]);

  const handleOpenNominate = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đề cử");
      return;
    }
    setNominateOpen(true);
  };

  const handleNominate = async () => {
    if (!normalizedNovelId) return;
    if (!nominationStatus || nominationStatus.remaining <= 0) {
      toast.error("Bạn đã hết lượt đề cử hôm nay");
      return;
    }
    if (!nominateCount || nominateCount <= 0) {
      toast.error("Vui lòng chọn số lượt đề cử");
      return;
    }

    setNominateLoading(true);
    try {
      const res = await nominateNovel(normalizedNovelId, nominateCount);
      toast.success(res.message || "Đề cử thành công");
      setNominationStatus({
        limit: res.limit,
        usedToday: res.usedToday,
        remaining: res.remaining,
        nominationCount: res.nominationCount,
      });
      setNominateOpen(false);
    } catch (err) {
      toastApiError(err, "Đề cử thất bại");
    } finally {
      setNominateLoading(false);
    }
  };

  const handleOpenGift = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để tặng quà");
      return;
    }
    setGiftOpen(true);
  };

  const handleGift = async () => {
    if (!normalizedChapterId) return;
    if (!user) {
      toast.error("Vui lòng đăng nhập để tặng quà");
      return;
    }

    const coins = Number(giftCoins);
    if (!Number.isFinite(coins) || coins <= 0) {
      toast.error("Số xu không hợp lệ");
      return;
    }

    setGiftLoading(true);
    try {
      const result = await giftChapter(normalizedChapterId, coins);
      toast.success(result.message || "Cảm ơn bạn đã tặng quà!");
      if (typeof result.coins === "number") {
        setUser?.(user ? { ...user, coins: result.coins } : user);
      }
      setGiftOpen(false);
      setGiftCoins(10);
    } catch (error) {
      toastApiError(error, "Không thể tặng quà");
    } finally {
      setGiftLoading(false);
    }
  };

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
        onPrev={() => {
          if (!prevId) return;
          void flushReadingSession();
          router.push(`/novels/${id}/chapters/${prevId}`);
        }}
        onNext={() => {
          if (!nextId) return;
          void flushReadingSession();
          router.push(`/novels/${id}/chapters/${nextId}`);
        }}
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
        <ChapterReader chapterId={normalizedChapterId || (chapterId as string)} readerSettings={readerSettings} onReadable={handleReadable} />
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
        onInfo={() => router.push(`/novels/${id}`)}
        readerSettings={readerSettings}
        onReport={handleReport}
        onNominate={handleOpenNominate}
        onGift={handleOpenGift}
      />

      <Dialog open={giftOpen} onOpenChange={setGiftOpen}>
        {giftOpen && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tặng quà</DialogTitle>
              <DialogDescription>Nhập số xu bạn muốn tặng cho người đăng truyện.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={giftCoins}
                  onChange={(e) => {
                    const val = parseInt(e.target.value || "0", 10);
                    if (!Number.isFinite(val)) return;
                    setGiftCoins(Math.max(1, val));
                  }}
                />
                <span className="text-sm">xu</span>
              </div>
              <p className="text-xs text-muted-foreground">Số dư hiện tại: {(user?.coins ?? 0).toLocaleString("vi-VN")} xu</p>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setGiftOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleGift} disabled={giftLoading}>
                {giftLoading ? "Đang tặng..." : "Xác nhận"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={nominateOpen} onOpenChange={setNominateOpen}>
        {nominateOpen && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Đề cử truyện</DialogTitle>
              <DialogDescription>
                Mỗi ngày bạn có {nominationStatus?.limit ?? NOMINATION_DAILY_LIMIT_DISPLAY} lượt đề cử. Lượt chưa dùng sẽ không cộng dồn.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {nominationStatus ? (
                <p className="text-sm text-muted-foreground">
                  Bạn còn <span className="font-semibold text-foreground">{nominationStatus.remaining}</span> lượt đề cử hôm nay.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Đang tải trạng thái đề cử...</p>
              )}

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={Math.max(1, nominationStatus?.remaining ?? 1)}
                  value={nominateCount}
                  disabled={!nominationStatus || nominationStatus.remaining <= 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value || "0", 10);
                    const remaining = nominationStatus?.remaining ?? 0;
                    if (!Number.isFinite(val)) return;
                    setNominateCount(Math.min(Math.max(1, val), Math.max(1, remaining)));
                  }}
                />
                <span className="text-sm">phiếu</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setNominateOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleNominate}
                disabled={nominateLoading || !nominationStatus || nominationStatus.remaining <= 0}
              >
                {nominateLoading ? "Đang đề cử..." : "Đề cử"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Floating scroll buttons: go to top / go to bottom */}
      <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
        <button
          aria-label="Lên đầu trang"
          title="Lên đầu trang"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M3.293 9.293a1 1 0 011.414 0L10 14.586l5.293-5.293a1 1 0 111.414 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414z" clipRule="evenodd" transform="rotate(180 10 10)" />
          </svg>
        </button>

        <button
          aria-label="Xuống cuối trang"
          title="Xuống cuối trang"
          onClick={() => {
            if (typeof window !== "undefined") {
              const scrollTarget = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
              window.scrollTo({ top: scrollTarget, behavior: "smooth" });
            }
          }}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M3.293 9.293a1 1 0 011.414 0L10 14.586l5.293-5.293a1 1 0 111.414 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="chapter"
        targetId={normalizedChapterId}
        targetTitle={chapter.title}
      />
    </div>
  );
}
