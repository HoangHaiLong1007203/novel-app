"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import { API } from "@/lib/api";
import { Input, Button } from "@/components/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hook/useAuth";
import { toast } from "@/lib/toast";
import { toastApiError } from "@/lib/errors";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id: {
          initialize: (opts: { client_id: string; callback: (resp: { credential?: string }) => void }) => void;
          renderButton: (el: Element | null, opts: unknown) => void;
        };
      };
    };
    FB?: {
      init: (opts: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (cb: (resp: { authResponse?: { accessToken?: string } }) => void, opts?: unknown) => void;
    };
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { setUser } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // clear previous errors via toast (no-op)

    try {
      const res = await API.post("/api/auth/login", form);
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      // Fetch user data and update auth state
      const userRes = await API.get("/api/auth/me");
      setUser(userRes.data);
      toast.success("Đăng nhập thành công");
      router.replace(redirect);
    } catch (err) {
      const message = toastApiError(err, "Đăng nhập thất bại");
      toast.error(message);
    }
  }

  // Social login helpers
  const handleSocialLogin = useCallback(async (path: "google" | "facebook", payload: Record<string, unknown>) => {
    try {
      const res = await API.post(`/api/auth/${path}`, payload);
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      const userRes = await API.get("/api/auth/me");
      setUser(userRes.data);
      toast.success("Đăng nhập thành công");
      router.replace(redirect);
    } catch (err) {
      const message = toastApiError(err, "Đăng nhập thất bại");
      toast.error(message);
    }
  }, [router, redirect, setUser]);

  // Google Identity Services
  useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    const existing = document.getElementById("google-client-script");
    if (existing) {
      // init if library already present
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (resp: { credential?: string }) => {
            if (resp?.credential) handleSocialLogin("google", { idToken: resp.credential });
          },
        });
        window.google.accounts.id.renderButton(document.getElementById("google-signin"), { theme: "outline", size: "large" });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "google-client-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (resp: { credential?: string }) => {
            if (resp?.credential) handleSocialLogin("google", { idToken: resp.credential });
          },
        });
        window.google.accounts.id.renderButton(document.getElementById("google-signin"), { theme: "outline", size: "large" });
      }
    };
    document.body.appendChild(script);
  }, [handleSocialLogin]);

  // Facebook SDK
  useEffect(() => {
    const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!fbAppId) return;
    if (document.getElementById("facebook-jssdk")) return;
    const fbRoot = document.createElement("div");
    fbRoot.id = "fb-root";
    document.body.appendChild(fbRoot);
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.FB) {
        window.FB.init({
          appId: fbAppId,
          cookie: true,
          xfbml: false,
          version: "v16.0",
        });
      }
    };
    document.body.appendChild(script);
  }, []);

  // Surface global promise rejections (e.g. FB SDK network errors blocked by extensions/firewall)
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const reason = (e?.reason && String(e.reason)) || "";
      if (reason.includes("Failed to fetch") || reason.includes("ERR_BLOCKED_BY_ADMINISTRATOR")) {
        toast.error(
          "Lỗi khi gọi Facebook SDK — có thể do extension (adblock/AV) hoặc chính sách mạng chặn. Hãy thử tắt extension hoặc mở trang bằng npm run dev (localhost) và kiểm tra lại."
        );
      }
    };
    window.addEventListener("unhandledrejection", handler as EventListener);
    return () => window.removeEventListener("unhandledrejection", handler as EventListener);
  }, []);

  function handleFBLogin() {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (!isLocal && window.location.protocol !== "https:") {
      toast.error("Facebook login yêu cầu HTTPS. Vui lòng dùng HTTPS hoặc cấu hình trên Facebook.");
      return;
    }

    const FB = window.FB;
    if (!FB) {
      toast.error("Facebook SDK chưa sẵn sàng");
      return;
    }

    FB.login((response: { authResponse?: { accessToken?: string } }) => {
      if (response && response.authResponse && response.authResponse.accessToken) {
        void handleSocialLogin("facebook", { accessToken: response.authResponse.accessToken }).catch(() => {
          toast.error("Đăng nhập Facebook thất bại");
        });
        } else {
        toast.error("Facebook login bị hủy hoặc thất bại");
      }
    }, { scope: "email" });
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

        
        <Button type="submit" className="w-full">
          Đăng nhập
        </Button>
        <div className="space-y-3">
          <div className="text-center text-sm text-gray-500">Hoặc đăng nhập bằng</div>
          <div id="google-signin" className="flex justify-center"></div>
          {/* <div className="flex justify-center">
            <Button type="button" onClick={handleFBLogin} className="w-full max-w-xs">
              Đăng nhập bằng Facebook
            </Button>
          </div> */}
        </div>


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
