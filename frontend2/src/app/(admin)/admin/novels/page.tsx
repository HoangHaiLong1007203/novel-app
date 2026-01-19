"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import AdminGenreManager from "@/components/admin/AdminGenreManager";
import NovelSearchPanel from "@/components/novel/NovelSearchPanel";


export default function AdminNovelsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<string>(searchParams.get("tab") ?? "genres");

  useEffect(() => {
    const current = searchParams.get("tab") ?? "genres";
    setTab(current);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl);
  };

  const handleRead = (novelId: string) => router.push(`/novels/${novelId}`);
  const handleEdit = (novelId: string) => router.push(`/novels/update/${novelId}`);

  return (
    <section className="mx-auto w-full max-w-6xl px-2 py-6 sm:px-4">
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <div className="sticky top-[4.5rem] z-30 -mx-2 border-b bg-background/90 px-2 py-4 backdrop-blur sm:-mx-4 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary/70">Admin / Novels</p>
              <h1 className="text-2xl font-semibold">Trung tâm quản lý truyện</h1>
              <p className="text-sm text-muted-foreground">Ghim tab để chuyển nhanh giữa thể loại và danh sách truyện.</p>
            </div>
            <TabsList>
              <TabsTrigger value="genres">Thể loại</TabsTrigger>
              <TabsTrigger value="novels">Truyện</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="genres" className="py-6 focus-visible:outline-none">
          <AdminGenreManager />
        </TabsContent>

        <TabsContent value="novels" className="py-6 focus-visible:outline-none">
          <NovelSearchPanel
            basePath="/admin/novels"
            heading="Tất cả truyện trong hệ thống"
            mode="edit"
            onRead={handleRead}
            onEdit={handleEdit}
          />
        </TabsContent>
      </Tabs>
      
    </section>
  );
}
