"use client";

import { useState, Suspense } from "react";
import { API } from "@/lib/api";
import { Input, Button } from "@/components/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hook/useAuth";
import type { AxiosError } from "axios";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { setUser } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/api/auth/login", form);
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      // Fetch user data and update auth state
      const userRes = await API.get("/api/auth/me");
      setUser(userRes.data);
      router.replace(redirect);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || "Đăng nhập thất bại");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow"
      >
        <h1 className="text-2xl font-semibold text-center">Đăng nhập</h1>

        <Input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          type="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" className="w-full">
          Đăng nhập
        </Button>
      </form>
    </div>
  );
}

// ✅ Bọc LoginForm trong <Suspense> khi export
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center p-6">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
