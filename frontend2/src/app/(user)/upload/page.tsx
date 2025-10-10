"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GENRES } from "@/lib/genres";
import { API } from "@/lib/api";
import { useAuth } from "@/hook/useAuth";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { Badge } from "@/components/ui";
import Link from "next/link";

type NovelType = "sáng tác" | "dịch/đăng lại";
type NovelStatus = "còn tiếp" | "tạm ngưng" | "hoàn thành";

interface FormState {
  title: string;
  type: NovelType | "";
  authorId?: string; // only for "dịch/đăng lại"
  description: string;
  genres: string[]; // selected genres
  status: NovelStatus;
  coverFile?: File | null;
}

export default function UploadPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    type: "",
    authorId: "",
    description: "",
    genres: [],
    status: "còn tiếp",
    coverFile: null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ---- helpers ----
  const updateField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((s) => ({ ...s, [k]: v }));
  };

  const validateField = (name: keyof FormState) => {
    const nextErrors = { ...errors };

    if (name === "title") {
      if (!form.title.trim()) {
        nextErrors.title = "Tiêu đề là bắt buộc.";
      } else if (form.title.trim().length < 3) {
        nextErrors.title = "Tiêu đề phải ít nhất 3 ký tự.";
      } else {
        delete nextErrors.title;
      }
    }

    if (name === "type") {
      if (!form.type) {
        nextErrors.type = "Vui lòng chọn loại (sáng tác / dịch/đăng lại).";
      } else {
        delete nextErrors.type;
      }
    }

    if (name === "genres") {
      if (!form.genres || form.genres.length === 0) {
        nextErrors.genres = "Chọn ít nhất 1 thể loại.";
      } else {
        delete nextErrors.genres;
      }
    }

    if (name === "authorId") {
      if (form.type === "dịch/đăng lại") {
        if (!form.authorId || !form.authorId.trim()) {
          nextErrors.authorId = "Với loại 'dịch/đăng lại' cần nhập Author ID.";
        } else {
          delete nextErrors.authorId;
        }
      } else {
        delete nextErrors.authorId;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAll = () => {
    // run all validators
    validateField("title");
    validateField("type");
    validateField("genres");
    validateField("authorId");
    // after validations, check errors
    const hasErrors = Object.keys(errors).length > 0;
    return !hasErrors;
  };

  // ---- tags multi-select ----
  const toggleGenre = (g: string) => {
    setForm((s) => {
      const exists = s.genres.includes(g);
      const next = exists ? s.genres.filter((x) => x !== g) : [...s.genres, g];
      return { ...s, genres: next };
    });
    // validate immediately after toggling
    setTimeout(() => validateField("genres"), 0);
  };

  // ---- file upload handlers ----
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    updateField("coverFile", f || null);

    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  // ---- submit ----
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    // run all validators
    // ensure latest errors cleared
    setErrors({});
    const titleOk = form.title.trim().length >= 3;
    const typeOk = !!form.type;
    const genresOk = form.genres.length > 0;
    const authorOk = form.type === "dịch/đăng lại" ? !!form.authorId?.trim() : true;

    const ok = titleOk && typeOk && genresOk && authorOk;
    if (!ok) {
      // set errors individually
      if (!titleOk) setErrors((e) => ({ ...e, title: "Tiêu đề không hợp lệ." }));
      if (!typeOk) setErrors((e) => ({ ...e, type: "Vui lòng chọn loại." }));
      if (!genresOk) setErrors((e) => ({ ...e, genres: "Chọn ít nhất 1 thể loại." }));
      if (!authorOk) setErrors((e) => ({ ...e, authorId: "Author ID là bắt buộc cho loại này." }));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("type", form.type);
      formData.append("description", form.description || "");
      formData.append("genres", form.genres.join(","));
      formData.append("status", form.status);
      // only include author if provided (for dịch/đăng lại)
      if (form.type === "dịch/đăng lại" && form.authorId) {
        formData.append("author", form.authorId.trim());
      }
      if (form.coverFile) {
        formData.append("cover", form.coverFile);
      }

      const res = await API.post("/api/novels", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("Tạo truyện thành công.");
      // redirect to novel detail or list
      const createdId = res.data?.novel?._id;
      if (createdId) {
        router.push(`/novels/${createdId}`);
      } else {
        router.push("/novels");
      }
    } catch (err) {
      // safer error typing
      type AxiosErr = { response?: { data?: { message?: string } } };
      const msg = (err as AxiosErr)?.response?.data?.message || "Tạo truyện thất bại";
      setMessage(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  // if not logged in, show CTA
  if (!loading && !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="mb-4">Bạn cần đăng nhập để đăng truyện.</p>
          <div className="flex justify-center gap-3">
            <Link href="/login" className="underline">
              Đăng nhập
            </Link>
            <Link href="/register" className="underline">
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Đăng truyện mới</h1>

      {message && (
        <div className="mb-4 rounded-md bg-muted p-3 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* title */}
        <div>
          <Label htmlFor="title">Tiêu đề <span className="text-destructive">*</span></Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            onBlur={() => validateField("title")}
            placeholder="Nhập tiêu đề truyện"
          />
          {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
        </div>

        {/* type */}
        <div>
          <Label>Loại <span className="text-destructive">*</span></Label>
          <div className="flex gap-3 mt-2">
            {(["sáng tác", "dịch/đăng lại"] as NovelType[]).map((t) => (
              <button
                type="button"
                key={t}
                className={`px-3 py-1 rounded-md border ${
                  form.type === t ? "border-primary bg-primary/10" : "border-neutral"
                }`}
                onClick={() => {
                  updateField("type", t);
                  // trigger validation and author requirement re-eval
                  setTimeout(() => validateField("type"), 0);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {errors.type && <p className="text-sm text-destructive mt-1">{errors.type}</p>}
        </div>

        {/* authorId (only for dịch/đăng lại) */}
        {form.type === "dịch/đăng lại" && (
          <div>
            <Label htmlFor="authorId">Author (ID) <span className="text-destructive">*</span></Label>
            <Input
              id="authorId"
              value={form.authorId}
              onChange={(e) => updateField("authorId", e.target.value)}
              onBlur={() => validateField("authorId")}
              placeholder="Nhập ID tác giả (ObjectId) nếu có"
            />
            {errors.authorId && <p className="text-sm text-destructive mt-1">{errors.authorId}</p>}
          </div>
        )}

        {/* description */}
        <div>
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Mô tả ngắn về truyện (có thể để trống)"
            rows={5}
          />
        </div>

        {/* genres */}
        <div>
          <Label>Thể loại <span className="text-destructive">*</span></Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {GENRES.map((g) => {
              const selected = form.genres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  onBlur={() => validateField("genres")}
                  className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                    selected ? "border-primary bg-primary/10" : "border-neutral bg-transparent"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
          {errors.genres && <p className="text-sm text-destructive mt-1">{errors.genres}</p>}
        </div>

        {/* cover upload */}
        <div className="flex gap-4 items-start">
          <div>
            <Label>Ảnh bìa</Label>
            <div className="w-36 h-48 rounded-md border overflow-hidden bg-muted flex items-center justify-center">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="px-2 text-sm text-muted-foreground text-center">
                  Chưa có ảnh
                </div>
              )}
            </div>

            <div className="mt-2 flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
                className="hidden"
              />
              <Button type="button" onClick={triggerFilePicker}>Chọn ảnh</Button>
              <Button type="button" variant="ghost" onClick={() => { updateField("coverFile", null); setPreviewUrl(null); }}>
                Bỏ
              </Button>
            </div>
          </div>

          {/* right column: status & submit */}
          <div className="flex-1">
            <Label>Trạng thái</Label>
            <div className="mt-2 flex gap-2">
              {(["còn tiếp", "tạm ngưng", "hoàn thành"] as NovelStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateField("status", s)}
                  className={`px-3 py-1 rounded-md border ${form.status === s ? "border-primary bg-primary/10" : "border-neutral"}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang tạo..." : "Tạo truyện"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>Hủy</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
