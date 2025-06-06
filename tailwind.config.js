import { heroui } from "@heroui/theme";
import { theme } from "./config/theme";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      addCommonColors: false,
      layout: {
        spacingScale: {
          xs: 4, // 0.25rem
          sm: 8, // 0.5rem
          md: 16, // 1rem
          lg: 24, // 1.5rem
          xl: 32, // 2rem
          "2xl": 40, // 2.5rem
          "3xl": 48, // 3rem
          "4xl": 56, // 3.5rem
          "5xl": 64, // 4rem
          "6xl": 72, // 4.5rem
          "7xl": 80, // 5rem
          "8xl": 88, // 5.5rem
          "9xl": 96, // 6rem
        },
      },
      theme: theme,
    }),
  ],
};

module.exports = config;
