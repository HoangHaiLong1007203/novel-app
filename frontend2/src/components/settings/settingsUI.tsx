"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { toastApiError, toNormalizedError } from "@/lib/errors";
import {
  fetchReaderSettings,
  saveReaderSettings,
  ReaderSettingsPayload,
} from "@/lib/api";

const defaultSettings: Required<ReaderSettingsPayload> = {
  fontSize: 18,
  fontFamily: "Literata",
  backgroundColor: "#f6efe6",
  lineHeight: 1.8,
  theme: "sepia",
};

const fontOptions = [
  { label: "Literata (truyện dài)", value: "Literata" },
  { label: "Space Grotesk (đương đại)", value: "Space Grotesk" },
  { label: "Be Vietnam Pro (gọn gàng)", value: "Be Vietnam Pro" },
  { label: "Merriweather (cổ điển)", value: "Merriweather" },
  { label: "System", value: "system" },
];

const themePresets: Record<string, { background: string; color: string }> = {
  light: { background: "#ffffff", color: "#1f1f1f" },
  dark: { background: "#111217", color: "#f5f5f1" },
  sepia: { background: "#f6efe6", color: "#432818" },
};

const localKey = "novel-app-reader-settings";

type Props = {
  onChange?: (settings: ReaderSettingsPayload) => void;
  onClose?: () => void;
};

const SettingsUI = ({ onChange, onClose }: Props) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(localKey);
          if (cached) {
            persist(JSON.parse(cached));
          }
        }
        const serverSettings = await fetchReaderSettings().catch(() => null);
        if (serverSettings) {
          persist(serverSettings);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const previewStyle = useMemo(() => {
    const palette = themePresets[settings.theme] || themePresets.sepia;
    const fontVarMap: Record<string, string> = {
      "Literata": "var(--font-literata)",
      "Space Grotesk": "var(--font-space-grotesk)",
      "Be Vietnam Pro": "var(--font-be-vietnam-pro)",
      "Merriweather": "var(--font-merriweather)",
      "system": "system-ui, sans-serif",
    };

    const chosen = settings.fontFamily;
    const familyBase = fontVarMap[chosen] || chosen;
    const fontFamily = familyBase.includes("var(") ? `${familyBase}, sans-serif` : `${familyBase}, "Be Vietnam Pro", "Space Grotesk", sans-serif`;

    return {
      fontSize: `${settings.fontSize}px`,
      fontFamily,
      backgroundColor: settings.backgroundColor || palette.background,
      color: palette.color,
      lineHeight: settings.lineHeight,
    };
  }, [settings]);

  const persist = (next: ReaderSettingsPayload) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next } as Required<ReaderSettingsPayload>;
      if (typeof window !== "undefined") {
        localStorage.setItem(localKey, JSON.stringify(merged));
      }
      return merged;
    });
  };

  // Notify parent about setting changes after render to avoid setState-in-render
  useEffect(() => {
    onChange?.(settings);
  }, [settings, onChange]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Always persist to local first so settings are not lost
      persist(settings);

      const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!accessToken || accessToken === "undefined" || accessToken === "null") {
        toast.success("Đã lưu tại local (chưa đăng nhập)");
        onClose?.();
        return;
      }

      // If logged in, attempt to save on server
      const server = await saveReaderSettings(settings);
      persist(server);
      toast.success("Đã lưu tuỳ chỉnh vào tài khoản");
      onClose?.();
    } catch (error: unknown) {
      const normalized = toNormalizedError(error);
      const fallback = normalized.status === 401
        ? "Chưa đăng nhập — đã lưu tại local"
        : "Không thể lưu lên máy chủ, đã lưu tại local";
      toastApiError(error, fallback);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6 shadow-lg ring-1 ring-orange-100">
        <p className="text-sm font-semibold tracking-wide text-amber-600">Đang tải tuỳ chỉnh...</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6 shadow-xl ring-1 ring-orange-100 h-full min-h-0">


        <div className="grid gap-6 grid-cols-2 items-stretch h-full min-h-0">
          <div className="space-y-3 overflow-auto min-h-0">
          <header className="mb-2 flex items-baseline justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">định dạng</p>
              {/* <h2 className="text-2xl font-semibold text-slate-900">Bảng điều khiển trải nghiệm đọc</h2> */}
            </div>
          </header>

          <label className="block text-sm font-semibold text-slate-700">
            Cỡ chữ: {settings.fontSize}px
            <input
              type="range"
              min={14}
              max={32}
              value={settings.fontSize}
              className=" w-full accent-amber-500"
              onChange={(e) => persist({ fontSize: Number(e.target.value) })}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Dãn dòng: {settings.lineHeight.toFixed(1)}
            <input
              type="range"
              step={0.1}
              min={1.2}
              max={2.4}
              value={settings.lineHeight}
              className=" w-full accent-amber-500"
              onChange={(e) => persist({ lineHeight: Number(e.target.value) })}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Font chữ
            <select
              className="mt-2 w-full rounded-xl border border-amber-200 bg-white/70 px-3 py-2 text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none"
              value={settings.fontFamily}
              onChange={(e) => persist({ fontFamily: e.target.value })}
            >
              {fontOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Nền riêng (hex)
            <input
              type="text"
              maxLength={7}
              value={settings.backgroundColor}
              className="mt-2 w-full rounded-xl border border-amber-200 bg-white/70 px-3 py-2 text-slate-900 shadow-sm focus:border-amber-400 focus:outline-none"
              onChange={(e) => persist({ backgroundColor: e.target.value })}
            />
          </label>

          <div className="flex gap-2">
            {Object.entries(themePresets).map(([theme, palette]) => (
              <button
                key={theme}
                className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold capitalize ${
                  settings.theme === theme
                    ? "border-amber-500 text-amber-700"
                    : "border-transparent text-slate-600"
                }`}
                style={{ background: palette.background, color: palette.color }}
                onClick={() => persist({ theme: theme as ReaderSettingsPayload["theme"], backgroundColor: palette.background })}
                type="button"
              >
                {theme}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-amber-200 transition hover:shadow-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu định dạng"}
          </button>
        </div>

        <div
          className="rounded-3xl p-6 shadow-inner flex flex-col h-full min-h-0"
          style={{ background: previewStyle.backgroundColor }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-600">Preview</p>
          <article
            className="mt-4 rounded-2xl bg-white/40 p-5 text-base shadow-md flex-1 min-h-0 overflow-hidden"
            style={{ fontSize: previewStyle.fontSize, fontFamily: previewStyle.fontFamily, lineHeight: previewStyle.lineHeight, color: previewStyle.color }}
          >
            <p className="mt-4 text-justify">
              Thử thay đổi font, màu nền hoặc dãn dòng rồi cảm nhận ngay trong khung preview này. Các chương sẽ áp dụng cùng phong cách khi bạn đọc trên mọi thiết bị.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
};

export default SettingsUI;
