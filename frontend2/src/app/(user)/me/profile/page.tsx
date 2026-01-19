"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CreditCard, ShieldCheck, Coins, BellRing, History, Unlock, UserRound, Loader2, Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/hook/useAuth";
import { API } from "@/lib/api";
import { toast } from "@/lib/toast";
import { toastApiError } from "@/lib/errors";
import { Badge, Button, Input, Label, Separator, Skeleton } from "@/components/ui";
import { ProfileAvatarUploader } from "@/components/profile/ProfileAvatarUploader";
import { ProfileSectionCard } from "@/components/profile/ProfileSectionCard";
import {
  ProfileSidebar,
  type ProfileSidebarItemConfig,
} from "@/components/profile/ProfileSidebar";
import { ProfileTabsBar } from "@/components/profile/ProfileTabsBar";
import { NotificationsList } from "@/components/profile/NotificationsList";
import { TransactionsList } from "@/components/profile/TransactionsList";
import { UnlockHistoryList } from "@/components/profile/UnlockHistoryList";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,128}$/;
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

const SIDEBAR_ITEMS: ProfileSidebarItemConfig[] = [
  {
    key: "profile",
    label: "Profile",
    description: "Thông tin & avatar",
    href: "/me/profile",
    icon: UserRound,
  },
  {
    key: "notifications",
    label: "Thông báo",
    description: "Theo dõi cập nhật",
    href: "/me/profile/notifications",
    icon: BellRing,
    disabled: false,
  },
  {
    key: "topup-history",
    label: "Lịch sử nạp",
    description: "Các giao dịch gần đây",
    href: "/me/profile/topup-history",
    icon: History,
    disabled: false,
  },
  {
    key: "unlock-history",
    label: "Lịch sử mở khóa",
    description: "Chương đã mua",
    href: "/me/profile/unlock-history",
    icon: Unlock,
    disabled: false,
  },
];

interface PasswordFormState {
  newPassword: string;
  confirmPassword: string;
}

const providerLabels: Record<string, string> = {
  local: "Email",
  google: "Google",
  facebook: "Facebook",
};

export default function ProfilePage() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (!avatarPreview) return;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const providerBadges = useMemo(() => user?.providers ?? [], [user]);
  const joinedAt = useMemo(() => formatDate(user?.createdAt), [user?.createdAt]);
  const isUsernameDirty = user ? user.username !== username.trim() : false;
  const activeNavKey = useMemo(() => {
    if (!pathname) return "profile";
    // Prefer the most specific (longest) matching href so /me/profile/notifications
    // doesn't incorrectly match the parent /me/profile entry.
    let best: ProfileSidebarItemConfig | undefined;
    for (const item of SIDEBAR_ITEMS) {
      if (!item.href) continue;
      if (pathname === item.href) {
        best = item;
        break;
      }
      if (pathname.startsWith(item.href)) {
        if (!best || (item.href.length > (best.href?.length ?? 0))) {
          best = item;
        }
      }
    }
    return best?.key ?? "profile";
  }, [pathname]);

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    return (
      <section className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center gap-3 px-4 py-10 text-center">
        <p className="text-lg font-semibold">Bạn cần đăng nhập để xem trang này.</p>
        <p className="text-sm text-muted-foreground">Trình quản lý tài khoản chỉ khả dụng sau khi đăng nhập.</p>
      </section>
    );
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = username.trim();

    if (!trimmed.length) {
      const message = "Username không được để trống";
      setProfileError(message);
      toast.error(message);
      return;
    }

    if (!isUsernameDirty) {
      toast("Bạn chưa thay đổi thông tin nào");
      return;
    }

    try {
      setIsSavingProfile(true);
      const { data } = await API.put("/api/auth/change-username", {
        newUsername: trimmed,
      });
      if (data?.user) {
        setUser(data.user);
        setUsername(data.user.username);
        setProfileError(null);
        toast.success("Đã cập nhật thông tin hồ sơ");
      }
    } catch (error) {
      const message = toastApiError(error, "Không thể cập nhật thông tin hồ sơ");
      setProfileError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { newPassword, confirmPassword } = passwordForm;

    if (!newPassword.length) {
      const message = "Vui lòng nhập mật khẩu mới";
      setPasswordError(message);
      toast.error(message);
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      const message = "Mật khẩu 6-128 ký tự, gồm chữ và số";
      setPasswordError(message);
      toast.error(message);
      return;
    }

    if (newPassword !== confirmPassword) {
      const message = "Mật khẩu nhập lại không khớp";
      setPasswordError(message);
      toast.error(message);
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await API.put("/api/auth/change-password", { newPassword });
      toast.success("Đã cập nhật mật khẩu");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setPasswordError(null);
    } catch (error) {
      const message = toastApiError(error, "Không thể cập nhật mật khẩu");
      setPasswordError(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAvatarSelect = async (file: File) => {
    if (!user) return;
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast.error("Ảnh tối đa 5MB");
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setIsUploadingAvatar(true);
      const { data } = await API.post("/api/auth/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data?.user) {
        setUser(data.user);
        toast.success("Đã cập nhật avatar");
        setAvatarPreview(null);
      }
    } catch (error) {
      toastApiError(error, "Không thể cập nhật avatar");
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleTopUpClick = () => {
    router.push("/me/topup");
  };

  const handleHistoryClick = () => {
    router.push("/me/profile/topup-history");
  };

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-0 pb-8 lg:pb-10">
      <div className="flex flex-col gap-6">
        <div className="sticky top-14 z-30 bg-background/95 py-2 shadow-sm backdrop-blur lg:hidden">
          <ProfileTabsBar items={SIDEBAR_ITEMS} activeKey={activeNavKey} onNavigate={handleNavigate} />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="hidden lg:sticky lg:top-20 lg:block lg:w-64 lg:shrink-0">
            <ProfileSidebar items={SIDEBAR_ITEMS} activeKey={activeNavKey} />
          </aside>
          <div className="flex-1 space-y-6">
            {activeNavKey === "profile" ? (
              <>
                <ProfileSectionCard
                  title="Hồ sơ cá nhân"
                  description="Cập nhật avatar và tên hiển thị của bạn"
                >
                  <div className="space-y-6">
                    <ProfileAvatarUploader
                      avatarUrl={user.avatarUrl}
                      previewUrl={avatarPreview}
                      username={user.username}
                      isUploading={isUploadingAvatar}
                      onSelectFile={handleAvatarSelect}
                    />
                    <Separator />
                    <form className="space-y-5" onSubmit={handleProfileSubmit}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            name="username"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Nhập username mới"
                            autoComplete="nickname"
                          />
                          {profileError ? (
                            <p className="text-sm text-destructive">{profileError}</p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" value={email || "Chưa cập nhật"} disabled readOnly />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Ngày tham gia</Label>
                          <Input value={joinedAt} disabled readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label>Liên kết tài khoản</Label>
                          <div className="flex flex-wrap gap-2">
                            {providerBadges.length ? (
                              providerBadges.map((provider) => (
                                <Badge key={`${provider.name}-${provider.providerId ?? "default"}`} variant="secondary">
                                  {providerLabels[provider.name] ?? provider.name}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline">Chưa có</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setUsername(user.username)} disabled={isSavingProfile || !isUsernameDirty}>
                          Hủy
                        </Button>
                        <Button type="submit" disabled={isSavingProfile || !isUsernameDirty}>
                          {isSavingProfile ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                          Lưu thay đổi
                        </Button>
                      </div>
                    </form>
                  </div>
                </ProfileSectionCard>

                <ProfileSectionCard title="Bảo mật & mật khẩu" description="Thiết lập mật khẩu mạnh để bảo vệ tài khoản">
                  <form className="space-y-5" onSubmit={handlePasswordSubmit}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Mật khẩu mới</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                            autoComplete="new-password"
                            placeholder="Tối thiểu 6 ký tự"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          >
                            {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordChange}
                            autoComplete="new-password"
                            placeholder="Nhập lại để xác nhận"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          >
                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Mật khẩu cần 6-128 ký tự, bao gồm ít nhất một chữ cái và một chữ số, không khoảng trắng.</p>
                    {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isUpdatingPassword || !passwordForm.newPassword.length || !passwordForm.confirmPassword.length} className="gap-2">
                        <ShieldCheck className="size-4" />
                        {isUpdatingPassword ? "Đang lưu..." : "Đổi mật khẩu"}
                      </Button>
                    </div>
                  </form>
                </ProfileSectionCard>

                <ProfileSectionCard title="Ví xu" description="Theo dõi số dư và nạp thêm khi cần" actionSlot={<Button type="button" variant="ghost" size="sm" onClick={handleHistoryClick}>Xem lịch sử</Button>}>
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Số dư hiện có</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <Coins className="size-5 text-primary" />
                        <span className="text-3xl font-semibold">{(user.coins ?? 0).toLocaleString("vi-VN")}</span>
                        <span className="text-sm text-muted-foreground">xu</span>
                      </div>
                    </div>
                    <Button type="button" size="lg" className="gap-2" onClick={handleTopUpClick}>
                      <CreditCard className="size-5" />
                      Nạp xu
                    </Button>
                  </div>
                </ProfileSectionCard>
              </>
            ) : null}

            {activeNavKey === "notifications" ? <NotificationsList /> : null}

            {activeNavKey === "topup-history" ? <TransactionsList type="topup" /> : null}

            {activeNavKey === "unlock-history" ? <UnlockHistoryList /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ProfilePageSkeleton() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </section>
  );
}
