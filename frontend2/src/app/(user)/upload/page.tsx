"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GENRES } from "@/lib/genres";
import { API } from "@/lib/api";
import { useAuth } from "@/hook/useAuth";
import { Button, Input, Label, Textarea } from "@/components/ui";
import NovelCard from "@/components/novel/NovelCard";
import Link from "next/link";

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

export default function UploadPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    type: "",
    author: "",
    description: "",
    genres: [],
    status: "còn tiếp",
    coverFile: null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [userNovels, setUserNovels] = useState<Novel[]>([]);

  const updateField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((s) => ({ ...s, [k]: v }));
  };

  // fetch user novels
  useEffect(() => {
    if (user?._id) {
      API.get(`/api/novels?poster=${user._id}`)
        .then((res) => setUserNovels(res.data?.novels || []))
        .catch(() => setUserNovels([]));
    }
  }, [user]);

  // set author based on type
  useEffect(() => {
    if (form.type === "sáng tác" && user?.username) {
      updateField("author", user.username);
    } else if (form.type === "dịch/đăng lại") {
      updateField("author", "");
    }
  }, [form.type, user?.username]);

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

  const validateTextFields = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Vui lòng nhập tên truyện.";
    if (!form.author.trim()) next.author = "Vui lòng nhập tên tác giả.";
    setErrors(next);
    return Object.keys(next).length === 0;
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
    setMessage(null);

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
      const exists = novels.some(
        (n) =>
          n.title.toLowerCase() === form.title.toLowerCase() &&
          n.author.toLowerCase() === form.author.toLowerCase()
      );
      if (exists) {
        setMessage(`Truyện "${form.title}" bởi ${form.author} đã được đăng bởi người khác.`);
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

      const res = await API.post("/api/novels", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      router.push(`/novels/${res.data?.novel?._id || ""}`);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setMessage(e.response?.data?.message || "Tạo truyện thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && !user)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p>Bạn cần đăng nhập để đăng truyện.</p>
          <div className="flex justify-center gap-3 mt-3">
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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* vùng truyện đã đăng */}
      <div>
        <p className="font-medium mb-2">
          Truyện đã đăng: <span>{userNovels.length}</span>
        </p>
        {userNovels.length > 0 && (
          <div>
            
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-3 scroll-smooth no-scrollbar">
                {userNovels.map((novel) => (
                  <div key={novel._id} className="shrink-0 w-[150px] sm:w-[180px]">
                    <NovelCard novel={novel} />
                  </div>
                ))}
              </div>

              {/* ẩn thanh cuộn */}
              <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>

              {/* overlay mờ bên phải */}
              {userNovels.length > 4 && (
                <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white via-white/70 to-transparent" />
              )}

              {/* nút xem thêm */}
              {userNovels.length > 4 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/70 backdrop-blur-sm"
                    onClick={() => router.push("/me/novels")}
                  >
                    Xem thêm →
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* form tạo truyện */}
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
              {GENRES.map((g) => (
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

          {message && <p className="text-sm text-destructive">{message}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang tạo..." : "Tạo truyện"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Hủy
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
