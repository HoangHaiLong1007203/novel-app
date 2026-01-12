"use client";

import { useState } from "react";
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
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/api/auth/register", form);
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      toast.success("Đăng ký thành công");
      router.push("/");
    } catch (err: unknown) {
      const message = toastApiError(err, "Đăng ký thất bại");
      setError(message);
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
            <Link href="/auth/login" className="text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Tên người dùng</Label>
            <Input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Nhập tên người dùng"
              required
            />
          </div>

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
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </Button>
        </form>
      </div>
    </div>
  );
}
