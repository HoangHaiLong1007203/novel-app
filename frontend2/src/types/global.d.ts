interface ImportMeta {
  glob(pattern: string, options?: { eager?: boolean }): Record<string, any>;
}

// src/types/global.d.ts
declare module "@/components/ui" {
  // 🪄 Import toàn bộ export thực tế từ index.ts
  export * from "@/components/ui/index";

  // ✨ Gợi ý thông minh (VSCode biết Button, Input,... là gì)
  import * as components from "@/components/ui/index";
  export type UIComponents = typeof components;
}
