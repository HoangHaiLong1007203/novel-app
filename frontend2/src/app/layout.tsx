import { AuthProvider } from "@/hook/useAuth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import BottomNavbar from "@/components/layout/bottomNavbar";
import ThemeFavicon from "@/components/theme-favicon";
import { ConfirmProvider } from "@/components/ui/confirm/ConfirmProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Literata, Space_Grotesk, Be_Vietnam_Pro, Merriweather } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const literata = Literata({ variable: "--font-literata", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const beVietnam = Be_Vietnam_Pro({ variable: "--font-be-vietnam-pro", subsets: ["vietnamese", "latin"], weight: ["400", "700"] });
const merri = Merriweather({ variable: "--font-merriweather", subsets: ["latin"] });

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
        className={`${geistSans.variable} ${geistMono.variable} ${literata.variable} ${spaceGrotesk.variable} ${beVietnam.variable} ${merri.variable} antialiased flex min-h-screen flex-col`}
      >
        <ThemeFavicon />

        {/* ✅ Bọc AuthProvider quanh toàn bộ app */}
        <AuthProvider>
          <ConfirmProvider>
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
            <Toaster richColors position="top-right" />
            <Footer />
            <BottomNavbar />
          </ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
