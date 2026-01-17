"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ui";
import { RefreshCw, Search, ShieldCheck, UserCheck, UserMinus2, Users2 } from "lucide-react";
import { useAdminUsers } from "@/hook/useAdminUsers";
import type { AdminUserRole, AdminUserStatus } from "@/types/adminUsers";
import { cn } from "@/lib/utils";

const statusStyleMap: Record<AdminUserStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  banned: "bg-rose-100 text-rose-700 border-rose-200",
};

const roleLabelMap: Record<AdminUserRole, string> = {
  admin: "Admin",
  user: "Người dùng",
};

const numberFormatter = new Intl.NumberFormat("vi-VN");
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function AdminUsersPage() {
  const { data, loading, error, params, setParams, changeUserRole, changeUserStatus, refresh } = useAdminUsers();
  const [searchValue, setSearchValue] = useState(params.search ?? "");
  const showSkeleton = loading && !data;

  useEffect(() => {
    setSearchValue(params.search ?? "");
  }, [params.search]);

  const statsCards = useMemo(
    () => [
      {
        id: "total",
        label: "Tổng người dùng",
        value: data?.stats.totalUsers ?? 0,
        icon: Users2,
      },
      {
        id: "new",
        label: "Đăng ký mới hôm nay",
        value: data?.stats.newUsersToday ?? 0,
        icon: UserCheck,
      },
      {
        id: "admin",
        label: "Tài khoản admin",
        value: data?.stats.adminCount ?? 0,
        icon: ShieldCheck,
      },
      {
        id: "banned",
        label: "Đang bị khóa",
        value: data?.stats.bannedCount ?? 0,
        icon: UserMinus2,
      },
    ],
    [data?.stats]
  );

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setParams({ search: searchValue });
  };

  const handleResetFilters = () => {
    setSearchValue("");
    setParams({ search: "", role: undefined, status: undefined, page: 1 });
  };

  const handleRoleFilterChange = (value: string) => {
    setParams({ role: value === "all" ? undefined : (value as AdminUserRole) });
  };

  const handleStatusFilterChange = (value: string) => {
    setParams({ status: value === "all" ? undefined : (value as AdminUserStatus) });
  };

  const handlePageChange = (page: number) => {
    if (page !== params.page) {
      setParams({ page });
    }
  };

  const renderPagination = () => {
    const totalPages = data?.pagination.totalPages ?? 1;
    const currentPage = data?.pagination.page ?? params.page;
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    const maxPagesToShow = 5;
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxPagesToShow - 1);
    if (end - start < maxPagesToShow - 1) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(evt) => {
                evt.preventDefault();
                if (currentPage > 1) handlePageChange(currentPage - 1);
              }}
              aria-disabled={currentPage === 1}
            />
          </PaginationItem>
          {start > 1 ? (
            <>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  isActive={currentPage === 1}
                  onClick={(evt) => {
                    evt.preventDefault();
                    handlePageChange(1);
                  }}
                >
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            </>
          ) : null}
          {pages.map((pageNumber) => (
            <PaginationItem key={`page-${pageNumber}`}>
              <PaginationLink
                href="#"
                isActive={currentPage === pageNumber}
                onClick={(evt) => {
                  evt.preventDefault();
                  handlePageChange(pageNumber);
                }}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          {end < totalPages ? (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  isActive={currentPage === totalPages}
                  onClick={(evt) => {
                    evt.preventDefault();
                    handlePageChange(totalPages);
                  }}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          ) : null}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(evt) => {
                evt.preventDefault();
                if (currentPage < totalPages) handlePageChange(currentPage + 1);
              }}
              aria-disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-primary/70">Admin / Users</p>
          <h1 className="text-3xl font-semibold">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground">Theo dõi người dùng, vai trò và trạng thái khóa tài khoản.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => refresh()} disabled={loading}>
          <RefreshCw className={cn("size-4", loading ? "animate-spin" : "")} />
          Làm mới
        </Button>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message || "Không thể tải dữ liệu người dùng"}
        </div>
      ) : null}

      {showSkeleton ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={`stats-skeleton-${idx}`} className="p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-6 h-8 w-24" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                <item.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{numberFormatter.format(item.value)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">Tìm kiếm</label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Nhập username hoặc email"
                  className="flex-1"
                />
                <Button type="submit" className="gap-2">
                  <Search className="size-4" />
                  Tìm
                </Button>
              </div>
            </div>
          </form>
          <div className="flex flex-1 flex-col gap-2 md:max-w-[220px]">
            <label className="text-xs font-medium text-muted-foreground">Vai trò</label>
            <Select value={params.role ?? "all"} onValueChange={handleRoleFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {(data?.filters.roles ?? ["user", "admin"]).map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabelMap[role as AdminUserRole]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 flex-col gap-2 md:max-w-[220px]">
            <label className="text-xs font-medium text-muted-foreground">Trạng thái</label>
            <Select value={params.status ?? "all"} onValueChange={handleStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {(data?.filters.statuses ?? ["active", "banned"]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "active" ? "Đang hoạt động" : "Đã khóa"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="ghost" onClick={handleResetFilters}>
            Xóa lọc
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Danh sách người dùng</CardTitle>
              <span className="text-xs text-muted-foreground">
                {data?.pagination.total ?? 0} kết quả · Trang {data?.pagination.page ?? params.page}
              </span>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {showSkeleton ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={`row-skeleton-${idx}`} className="rounded-lg border p-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="mt-2 h-3 w-32" />
                  </div>
                ))}
              </div>
            ) : data && data.users.length > 0 ? (
              <div className="space-y-4">
                {data.users.map((user) => (
                  <div key={user.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Avatar className="size-12">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{user.username}</p>
                          <Badge variant="outline">{roleLabelMap[user.role]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{user.email || "Chưa có email"}</p>
                        <p className="text-xs text-muted-foreground">
                          Đăng ký: {dateFormatter.format(new Date(user.createdAt))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{numberFormatter.format(user.coins)} xu</p>
                        <p className="text-xs text-muted-foreground">
                          Cập nhật {dateFormatter.format(new Date(user.updatedAt))}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge className={cn("capitalize", statusStyleMap[user.status])}>
                        {user.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {user.providers.map((provider) => (
                          <Badge key={`${user.id}-${provider}`} variant="secondary" className="text-[11px]">
                            {provider}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value) => {
                          if (value !== user.role) {
                            changeUserRole(user.id, value as AdminUserRole);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(data.filters.roles ?? ["user", "admin"]).map((role) => (
                            <SelectItem key={`${user.id}-${role}`} value={role}>
                              {roleLabelMap[role as AdminUserRole]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant={user.status === "active" ? "destructive" : "secondary"}
                        onClick={() =>
                          changeUserStatus(user.id, user.status === "active" ? "banned" : "active")
                        }
                      >
                        {user.status === "active" ? "Khóa tài khoản" : "Mở khóa"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Không có người dùng nào phù hợp.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showSkeleton ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={`activity-skeleton-${idx}`} className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))
              ) : data && data.recentActivity.length > 0 ? (
                data.recentActivity.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(item.timestamp))}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có hoạt động nào.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ghi chú nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>- Thay đổi vai trò sẽ áp dụng ngay lập tức.</p>
              <p>- Tài khoản bị khóa sẽ không thể đăng nhập hay nạp xu.</p>
              <p>- Nên giữ ít nhất một admin hoạt động để tránh mất quyền quản trị.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {renderPagination()}
    </section>
  );
}
