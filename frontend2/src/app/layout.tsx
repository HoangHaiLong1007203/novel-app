import { AuthProvider } from "@/hook/useAuth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ThemeFavicon from "@/components/theme-favicon";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Novel App",
  description: "Ứng dụng đọc tiểu thuyết trực tuyến",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/assets/logo/favicon-light.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col`}
      >
        <ThemeFavicon />

        {/* ✅ Bọc AuthProvider quanh toàn bộ app */}
        <AuthProvider>
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
