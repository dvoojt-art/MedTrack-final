import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",

  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        body: ["Inter", "sans-serif"],
        headline: ["Inter", "sans-serif"],
        code: ["monospace"],
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },

        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },

        "fade-in-up": {
          from: {
            opacity: "0",
            transform: "translateY(12px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        "page-enter": {
          from: {
            opacity: "0",
            transform: "translateY(20px) scale(0.98)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",

        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "page-enter": "page-enter 0.4s ease-out forwards",
      },
    },
  },

  plugins: [tailwindcssAnimate],
};

export default config;