import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1f5eff", dark: "#123a99" },
      },
    },
  },
  plugins: [],
};
export default config;
