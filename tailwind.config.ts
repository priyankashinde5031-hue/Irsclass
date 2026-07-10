import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#7c3aed",
          dark: "#6d28d9",
          light: "#c084fc",
          50: "#faf5ff",
          100: "#f3e8ff",
        },
        ink: "#1c1420",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(40 24 30 / 0.04), 0 1px 3px 0 rgb(40 24 30 / 0.08)",
        lift: "0 10px 30px -12px rgb(60 30 40 / 0.28)",
        glow: "0 8px 24px -6px rgb(192 38 211 / 0.45)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7c3aed 0%, #c026d3 52%, #fb7185 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
