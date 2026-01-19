"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { API } from "@/lib/api";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { User } from "@/hook/useAuth";
import { toast } from "@/lib/toast";
import { toastApiError } from "@/lib/errors";
import { useGenres } from "@/hook/useGenres";

type NovelType = "sáng tác" | "dịch/đăng lại";
type NovelStatus = "còn tiếp" | "tạm ngưng" | "hoàn thành";

interface Novel {
  _id: string;
  title: string;
  author: string;
  coverUrl?: string;
}

interface FormState {
  title: string;
  type: NovelType | "";
  author: string;
  description: string;
  genres: string[];
  status: NovelStatus;
  coverFile?: File | null;
}

interface NovelFormProps {
  user: User | null; // from useAuth
  onSuccess: (novelId: string) => void; // callback after successful creation/update
  // optional: when provided, the form acts as update form
  novelId?: string;
  initial?: Partial<FormState> & { coverUrl?: string };
}

export default function NovelForm({ user, onSuccess, novelId, initial }: NovelFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { names: genreNames } = useGenres();

  const [form, setForm] = useState<FormState>({
    title: initial?.title || "",
    type: (initial?.type as NovelType) || "",
    author: initial?.author || "",
    description: initial?.description || "",
    genres: initial?.genres || [],
    status: (initial?.status as NovelStatus) || "còn tiếp",
    coverFile: null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.coverUrl || null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((s) => ({ ...s, [k]: v }));
  };

  // set author based on type
  useEffect(() => {
    if (form.type === "sáng tác" && user?.username) {
      updateField("author", user.username);
    } else if (form.type === "dịch/đăng lại") {
      // In edit mode (novelId provided), keep the existing author value.
      // Only clear the author automatically when creating a new novel.
      if (!novelId) updateField("author", "");
    }
  }, [form.type, user?.username, novelId]);

  // chuẩn hóa chữ khi blur
  const normalizeName = (val: string) =>
    val
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const onBlurNormalize = (key: "title" | "author") => {
    const normalized = normalizeName(form[key]);
    updateField(key, normalized);
    const newErrors = { ...errors };
    if (!normalized.trim()) {
      newErrors[key] = key === "title" ? "Vui lòng nhập tên truyện." : "Vui lòng nhập tên tác giả.";
    } else {
      delete newErrors[key];
    }
    setErrors(newErrors);
  };



  const triggerFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    updateField("coverFile", f || null);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // First: validate title, type, author
    const basicErrors: Record<string, string> = {};

    if (!form.title.trim()) basicErrors.title = "Vui lòng nhập tên truyện.";

    if (!form.type) basicErrors.type = "Vui lòng chọn loại truyện.";

    if (form.type !== "sáng tác" && !form.author.trim()) basicErrors.author = "Vui lòng nhập tên tác giả.";

    if (Object.keys(basicErrors).length > 0) {
      setErrors(basicErrors);
      return;
    }

    // Second: check duplicate
    try {
      const { data } = await API.get("/api/novels");
      const novels: Novel[] = data?.novels || [];
      const titleKey = form.title.trim().toLowerCase();
      const authorKey = form.author.trim().toLowerCase();
      const exists = novels.some(
        (n) =>
          n.title.toLowerCase() === titleKey &&
          n.author.toLowerCase() === authorKey &&
          (!novelId || n._id !== novelId)
      );
      if (exists) {
        toast.error(`Truyện "${form.title}" bởi ${form.author} đã được đăng bởi người khác.`);
        return;
      }
    } catch {
      /* ignore */
    }

    // Third: validate other fields (genres)
    const otherErrors: Record<string, string> = {};

    if (form.genres.length === 0) otherErrors.genres = "Chọn ít nhất một thể loại.";

    if (Object.keys(otherErrors).length > 0) {
      setErrors(otherErrors);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("type", form.type);
      formData.append("author", form.author.trim());
      formData.append("description", form.description);
      formData.append("genres", form.genres.join(","));
      formData.append("status", form.status);
      if (form.coverFile) formData.append("cover", form.coverFile);

      let res;
      if (novelId) {
        // update existing novel
        res = await API.put(`/api/novels/${novelId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // create new
        res = await API.post("/api/novels", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      const createdNovelId = res.data?.novel?._id || res.data?.novelId || "";
      const successMessage = res.data?.message || (novelId ? "Đã cập nhật truyện" : "Đã tạo truyện mới");
      toast.success(successMessage);
      onSuccess(createdNovelId);
    } catch (err) {
      const fallback = novelId ? "Cập nhật truyện thất bại." : "Tạo truyện thất bại.";
      toastApiError(err, fallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-6">
      {/* bên trái: ảnh bìa */}
      <div className="w-36 flex flex-col items-center gap-2">
        <Label>Ảnh bìa</Label>
        <div className="w-36 h-48 border rounded-md overflow-hidden flex items-center justify-center bg-muted relative">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="preview"
              fill
              sizes="144px"
              className="object-cover"
            />
          ) : (
            <span className="text-sm text-muted-foreground">Chưa có ảnh</span>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex gap-2">
          <Button type="button" onClick={triggerFilePicker} size="sm">
            Chọn ảnh
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              updateField("coverFile", null);
              setPreviewUrl(null);
            }}
          >
            Bỏ
          </Button>
        </div>
      </div>

      {/* bên phải: nội dung form */}
      <div className="flex-1 space-y-5">
        <div>
          <Label>Tiêu đề *</Label>
          <Input
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            onBlur={() => onBlurNormalize("title")}
            placeholder="Nhập tên truyện"
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        <div>
          <Label>Loại *</Label>
          <div className="flex gap-3 mt-2">
            {(["sáng tác", "dịch/đăng lại"] as NovelType[]).map((t) => (
              <Button
                key={t}
                type="button"
                variant={form.type === t ? "default" : "outline"}
                onClick={() => updateField("type", t)}
              >
                {t}
              </Button>
            ))}
          </div>
          {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
        </div>

        {form.type === "dịch/đăng lại" && (
          <div>
            <Label>Tác giả *</Label>
            <Input
              value={form.author}
              onChange={(e) => updateField("author", e.target.value)}
              onBlur={() => onBlurNormalize("author")}
              placeholder="Nhập tên tác giả"
            />
            {errors.author && <p className="text-sm text-destructive">{errors.author}</p>}
          </div>
        )}

        {form.type === "sáng tác" && (
          <div className="text-sm text-muted-foreground">
            Tác giả: {user?.username || "Không có tên"}
          </div>
        )}

        <div>
          <Label>Thể loại *</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {genreNames.map((g) => (
              <Button
                key={g}
                type="button"
                variant={form.genres.includes(g) ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  updateField(
                    "genres",
                    form.genres.includes(g)
                      ? form.genres.filter((x) => x !== g)
                      : [...form.genres, g]
                  )
                }
              >
                {g}
              </Button>
            ))}
          </div>
          {errors.genres && <p className="text-sm text-destructive">{errors.genres}</p>}
        </div>

        <div>
          <Label>Mô tả</Label>
          <Textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Mô tả ngắn (tuỳ chọn)"
          />
        </div>

        <div>
          <Label>Trạng thái</Label>
          <div className="flex gap-3 mt-2">
            {(["còn tiếp", "tạm ngưng", "hoàn thành"] as NovelStatus[]).map((s) => (
              <Button
                key={s}
                type="button"
                variant={form.status === s ? "default" : "outline"}
                onClick={() => updateField("status", s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? (novelId ? "Đang cập nhật..." : "Đang tạo...") : novelId ? "Cập nhật truyện" : "Tạo truyện"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => window.history.back()}>
            Hủy
          </Button>
        </div>
      </div>
    </form>
  );
}
