"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getChapterMeta,
  requestChapterAccess,
  purchaseLockedChapter,
  ReaderSettingsPayload,
} from "@/lib/api";
import { useAuth } from "@/hook/useAuth";
import { toast } from "@/lib/toast";
import { toastApiError } from "@/lib/errors";

const fallbackStyles: ReaderSettingsPayload = {
  fontSize: 18,
  fontFamily: "Literata",
  backgroundColor: "#fdf8f3",
  lineHeight: 1.8,
  theme: "sepia",
};

interface ChapterAccess {
  requiresPurchase?: boolean;
  publicHtmlUrl?: string | null;
  hasAccess?: boolean;
  htmlUrl?: string | null;
}

type AccessResponse = {
  html?: string;
  htmlUrl?: string | null;
};

interface ChapterMeta {
  _id?: string;
  title?: string;
  access?: ChapterAccess;
  priceXu?: number;
}

const ChapterReader = ({
  chapterId,
  readerSettings,
  onReadable,
}: {
  chapterId: string;
  readerSettings?: ReaderSettingsPayload;
  onReadable?: (readable: boolean) => void;
}) => {
  const [chapter, setChapter] = useState<ChapterMeta | null>(null);
  const [htmlContent, setHtmlContent] = useState("<p>Đang tải nội dung...</p>");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const { user, setUser } = useAuth();

  const appliedSettings = readerSettings || fallbackStyles;
  const readerStyle = useMemo(() => {
    const fontVarMap: Record<string, string> = {
      "Literata": "var(--font-literata)",
      "Space Grotesk": "var(--font-space-grotesk)",
      "Be Vietnam Pro": "var(--font-be-vietnam-pro)",
      "Merriweather": "var(--font-merriweather)",
      "system": "system-ui, sans-serif",
    };

    const chosen = String(appliedSettings.fontFamily ?? fallbackStyles.fontFamily);
    const familyBase = fontVarMap[chosen] || chosen;
    const fontFamily = familyBase.includes("var(") ? `${familyBase}, serif` : `${familyBase}, "Be Vietnam Pro", serif`;

    return {
      fontSize: `${appliedSettings.fontSize ?? fallbackStyles.fontSize}px`,
      fontFamily,
      lineHeight: appliedSettings.lineHeight ?? fallbackStyles.lineHeight,
      background: appliedSettings.backgroundColor ?? fallbackStyles.backgroundColor,
    };
  }, [appliedSettings]);

  const fetchHtmlFromUrl = useCallback(async (url?: string | null) => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const text = await res.text();
      setHtmlContent(text);
    } catch (err) {
      console.error("Failed to fetch html from url", err);
    }
  }, []);

  const hydrateChapter = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const meta = await getChapterMeta(chapterId);
      setChapter(meta);

      // If chapter requires purchase and server indicates user has no access,
      // don't call the access endpoint (which will return 402) — just show purchase UI.
      if (meta.access?.requiresPurchase && !meta.access?.hasAccess) {
        setHtmlContent("<p>Chương này đang bị khoá. Mua để tiếp tục đọc.</p>");
        onReadable?.(false);
      } else {
        // Request access URL (backend will return public or signed URL)
        try {
          const access = await requestChapterAccess(chapterId);
          const accessObj = access as AccessResponse;
          if (accessObj.html) {
            // mark as accessible and use inline HTML
            setChapter((c) => (c ? { ...c, access: { ...c.access, hasAccess: true } } : c));
            setHtmlContent(accessObj.html);
            onReadable?.(true);
          } else if (accessObj.htmlUrl) {
            setChapter((c) => (c ? { ...c, access: { ...c.access, hasAccess: true } } : c));
            await fetchHtmlFromUrl(accessObj.htmlUrl);
            onReadable?.(true);
          } else if (!meta.access?.requiresPurchase && meta.access?.publicHtmlUrl) {
            await fetchHtmlFromUrl(meta.access.publicHtmlUrl);
            onReadable?.(true);
          } else {
            setHtmlContent("<p>Chương này đang bị khoá. Mua để tiếp tục đọc.</p>");
            onReadable?.(false);
          }
        } catch (accessErr: unknown) {
          const status = typeof accessErr === 'object' && accessErr !== null && 'response' in accessErr
            ? (accessErr as { response?: { status?: number } }).response?.status
            : undefined;
          if (status === 402) {
            setHtmlContent("<p>Chương này đang bị khoá. Mua để tiếp tục đọc.</p>");
            onReadable?.(false);
          } else if (status === 401) {
            setHtmlContent("<p>Vui lòng đăng nhập để xem chương này.</p>");
            onReadable?.(false);
          } else {
            if (meta.access?.publicHtmlUrl) {
              await fetchHtmlFromUrl(meta.access.publicHtmlUrl);
              onReadable?.(true);
            } else {
              throw accessErr;
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error(err);
      const message = toastApiError(err, "Không thể tải chương, thử lại sau", { duration: 1000 });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [chapterId, fetchHtmlFromUrl, onReadable]);

  useEffect(() => {
    hydrateChapter();
  }, [hydrateChapter]);

  const unlockChapter = async () => {
    try {
      const access = await requestChapterAccess(chapterId);
      const accessObj = access as AccessResponse;
        if (accessObj.html) {
          setChapter((c) => (c ? { ...c, access: { ...c.access, hasAccess: true } } : c));
          setHtmlContent(accessObj.html);
          onReadable?.(true);
          const okMsg = "Đã nhận URL đọc chương";
          toast.success(okMsg, { duration: 1000 });
        } else if (accessObj.htmlUrl) {
          setChapter((c) => (c ? { ...c, access: { ...c.access, hasAccess: true } } : c));
          await fetchHtmlFromUrl(accessObj.htmlUrl);
          onReadable?.(true);
          const okMsg = "Đã nhận URL đọc chương";
          toast.success(okMsg, { duration: 1000 });
      }
    } catch (err: unknown) {
      const status = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
      const fallback = status === 402
        ? "Bạn cần mua chương này trước"
        : status === 401
        ? "Vui lòng đăng nhập để mở khoá"
        : "Không thể mở khoá, thử lại";
          toastApiError(err, fallback, { duration: 1000 });
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const result = await purchaseLockedChapter(chapterId);
      const ok = result.message || "Mua chương thành công";
      toast.success(ok, { duration: 1000 });
      if (typeof result.coins === "number") {
        setUser?.(user ? { ...user, coins: result.coins } : user);
      }
      await unlockChapter();
      await hydrateChapter();
    } catch (err: unknown) {
      const maybe = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { status?: number } }).response
        : undefined;
      const status = maybe?.status;
      const fallback = status === 400
        ? "Không đủ xu hoặc chương đã mở"
        : status === 401
        ? "Vui lòng đăng nhập để mua chương"
        : "Không thể thực hiện giao dịch";
          toastApiError(err, fallback, { duration: 1000 });
    } finally {
      setPurchasing(false);
    }
  };

  const showPurchaseCta = chapter?.access?.requiresPurchase && !chapter?.access?.hasAccess;
  const isLocked = Boolean(chapter?.access?.requiresPurchase && !chapter?.access?.hasAccess);
  // consider htmlContent real only when it's not the loading/locked placeholders
  const normalizedHtml = (htmlContent || "").trim();
  const isPlaceholder =
    normalizedHtml === "" ||
    normalizedHtml === "<p>Đang tải nội dung...</p>" ||
    normalizedHtml.includes("Chương này đang bị khoá") ||
    normalizedHtml.includes("Vui lòng đăng nhập để xem chương này.");

  const hasRealContent = !isPlaceholder && !loading && !error;

  return (
    <div className="space-y-6">
      {/* Only show purchase header when chapter is locked and user has no access */}
      {isLocked && (
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">chapter</p>
          <h1 className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">{chapter?.title || "Chương"}</h1>
          <p className="text-sm text-slate-200">
            {chapter?.access?.requiresPurchase
              ? `Khoá · ${chapter?.priceXu ?? 10} xu`
              : "Mở miễn phí"}
          </p>
          {showPurchaseCta && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="rounded-2xl bg-gradient-to-r from-amber-400 to-rose-500 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {purchasing ? "Đang mua..." : `Mở khóa ${chapter?.priceXu ?? 10} xu`}
              </button>
              <button
                onClick={unlockChapter}
                className="rounded-2xl border border-white/40 px-5 py-2 text-sm font-semibold text-white/90"
              >
                Tôi đã mua trước đó
              </button>
            </div>
          )}
          
        </div>
      )}

      {/* Settings UI is handled at page level to avoid duplicate controls */}

      {hasRealContent && (
        <section
          className="rounded-[32px] border border-slate-200/60 bg-white/90 p-6 shadow-2xl"
          style={{ background: readerStyle.background }}
        >
          <article
            className="prose prose-slate max-w-none"
            style={{
              fontSize: readerStyle.fontSize,
              fontFamily: readerStyle.fontFamily,
              lineHeight: readerStyle.lineHeight,
              color: chapter?.access?.requiresPurchase ? "#2b2b2b" : "#1f1f1f",
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </section>
      )}
    </div>
  );
};

export default ChapterReader;
