import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: "#f64d25",
        bg: "#f7f6f2",
        border: "rgba(246,77,37,0.14)",
      },
      fontFamily: {
        kaisei: ["'Kaisei Decol'", "serif"],
        sans: ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
