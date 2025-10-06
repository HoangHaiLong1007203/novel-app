import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("tailwindcss-animate"), // 👈 hiệu ứng mượt cho shadcn ui
  ],
};

export default config;
