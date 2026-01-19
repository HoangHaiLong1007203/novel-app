"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { API } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { toastApiError } from "@/lib/errors";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "username") {
      // reset availability state while editing
      setUsernameAvailable(null);
      setUsernameError("");
    }
  };

  const handleUsernameBlur = async () => {
    const value = (form.username || "").trim();
    if (!value) {
      setUsernameAvailable(false);
      setUsernameError("Tên người dùng không được để trống");
      return;
    }
    setUsernameChecking(true);
    try {
      const res = await API.get("/api/auth/check-username", { params: { username: value } });
      if (res.data && res.data.available) {
        setUsernameAvailable(true);
        setUsernameError("");
      } else {
        setUsernameAvailable(false);
        setUsernameError("Tên người dùng đã tồn tại");
      }
    } catch (err) {
      const message = toastApiError(err, "Kiểm tra username thất bại");
      toast.error(message);
      setUsernameAvailable(null);
      setUsernameError("");
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // previous inline error removed; use toast for errors

    // prevent submit if username known to be taken
    if (usernameAvailable === false) {
      toast.error("Tên người dùng đã tồn tại. Vui lòng chọn tên khác.");
      setLoading(false);
      return;
    }
    try {
      const res = await API.post("/api/auth/register", form);
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      toast.success("Đăng ký thành công");
      router.push("/login");
    } catch (err: unknown) {
      const message = toastApiError(err, "Đăng ký thất bại");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Tạo tài khoản</h1>
          <p className="text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">


          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>
            <Label htmlFor="username">Tên nhân vật</Label>
            <Input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              onBlur={handleUsernameBlur}
              placeholder="Nhập tên người dùng"
              required
            />
            {usernameChecking && <p className="text-sm text-gray-500">Đang kiểm tra tên người dùng...</p>}
            {usernameError && <p className="text-destructive text-sm">{usernameError}</p>}
          </div>
          

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </Button>
        </form>
      </div>
    </div>
  );
}
