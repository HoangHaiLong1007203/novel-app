"use client";

import { useEffect } from "react";

export default function ThemeFavicon() {
  useEffect(() => {
    const faviconLight = "/assets/logo/favicon-light.ico";
    const faviconDark = "/assets/logo/favicon-dark.ico";
    const link =
      document.querySelector<HTMLLinkElement>("link[rel='icon']") ||
      document.createElement("link");

    link.rel = "icon";

    // Hàm đổi favicon theo theme hiện tại
    const updateFavicon = () => {
      const currentTheme = localStorage.getItem("theme");
      link.href =
        currentTheme === "dark" ? faviconDark : faviconLight;
      document.head.appendChild(link);
    };

    updateFavicon();

    // Theo dõi theme khi người dùng đổi
    const observer = new MutationObserver(updateFavicon);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
