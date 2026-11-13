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
        teal: {
          50: "#F0FDF4",
          100: "#E7F2EF",
          200: "#C4E2DC",
          500: "#147D70",
          600: "#0E5C52",
          700: "#0B4A42",
          800: "#093F38",
          900: "#062A25",
        },
        brand: {
          dark: "#0F172A",
          muted: "#64748B",
          surface: "#F8FAFC",
          border: "#E2E8F0",
        },
      },
    },
  },
  plugins: [],
};
export default config;
