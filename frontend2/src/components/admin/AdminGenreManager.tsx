"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Switch, Textarea } from "@/components/ui";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useGenres, type GenreDto } from "@/hook/useGenres";
import { toast } from "@/lib/toast";
import { toastApiError } from "@/lib/errors";
import { useConfirm } from "@/components/ui/confirm/ConfirmProvider";

interface GenreFormState {
  name: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: GenreFormState = {
  name: "",
  description: "",
  isActive: true,
};

export default function AdminGenreManager() {
  const {
    genres,
    loading,
    refresh,
    createGenre: createGenreMutation,
    updateGenre: updateGenreMutation,
    deleteGenre: deleteGenreMutation,
  } = useGenres({ admin: true, includeInactive: true });
  const confirm = useConfirm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GenreDto | null>(null);
  const [form, setForm] = useState<GenreFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const sortedGenres = useMemo(() => {
    return [...genres].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [genres]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (genre: GenreDto) => {
    setEditing(genre);
    setForm({
      name: genre.name,
      description: genre.description || "",
      isActive: genre.isActive !== false,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setForm(EMPTY_FORM);
    setEditing(null);
  };

  const handleChange = <K extends keyof GenreFormState>(key: K, value: GenreFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Tên thể loại không được để trống");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };
      if (editing) {
        await updateGenreMutation(editing._id, payload);
        toast.success("Đã cập nhật thể loại");
      } else {
        await createGenreMutation(payload);
        toast.success("Đã tạo thể loại mới");
      }
      closeDialog();
      await refresh();
    } catch (err) {
      toastApiError(err, editing ? "Cập nhật thể loại thất bại" : "Tạo thể loại thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (genre: GenreDto) => {
    const ok = await confirm({
      title: "Xoá thể loại",
      description: `Bạn chắc chắn muốn xoá "${genre.name}"?`,
      confirmText: "Xoá",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteGenreMutation(genre._id);
      toast.success("Đã xoá thể loại");
      await refresh();
    } catch (err) {
      toastApiError(err, "Không thể xoá thể loại");
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl">Quản lý thể loại</CardTitle>
          <p className="text-sm text-muted-foreground">Danh sách này dùng cho NovelForm và bộ lọc.</p>
        </div>
        <Button onClick={openCreate} className="whitespace-nowrap">
          <Plus className="size-4 mr-2" /> Thêm thể loại
        </Button>
      </CardHeader>
      <CardContent>
        {loading && sortedGenres.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Đang tải thể loại...
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {sortedGenres.map((genre) => (
              <div
                key={genre._id}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
              >
                <Badge
                  className={`px-3 py-1 ${genre.isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                >
                  {genre.name}
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(genre)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDelete(genre)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {sortedGenres.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground">Chưa có thể loại nào.</p>
            ) : null}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa thể loại" : "Thêm thể loại"}</DialogTitle>
            <DialogDescription>
              {editing ? "Cập nhật tên, trạng thái hoặc mô tả." : "Tạo thể loại mới cho hệ thống."}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="genre-name">Tên thể loại *</Label>
              <Input
                id="genre-name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ví dụ: Huyền huyễn"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre-description">Mô tả</Label>
              <Textarea
                id="genre-description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Giải thích ngắn gọn về thể loại"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <Label>Kích hoạt</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={form.isActive} onCheckedChange={(checked) => handleChange("isActive", checked)} />
                  <span className="text-sm text-muted-foreground">Hiển thị trong filter</span>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : editing ? "Lưu thay đổi" : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
