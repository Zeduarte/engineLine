import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    // Container central com respiração generosa (design premium = espaço negativo).
    extend: {
      colors: {
        // Paleta escura com um único acento. Definida via CSS vars para ser
        // trivialmente re-tematizável (ver globals.css).
        ink: {
          DEFAULT: "#0A0A0A",
          soft: "#111112",
          muted: "#18181B",
        },
        paper: "#F5F5F4",
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
      },
      fontFamily: {
        // Inter carregado via next/font (ver layout.tsx) e exposto como var.
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Escala tipográfica confiante — títulos grandes.
        "display": ["clamp(3rem, 9vw, 9rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "headline": ["clamp(2rem, 5vw, 4rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      maxWidth: {
        content: "80rem",
      },
      transitionTimingFunction: {
        // Curva "Apple-like": arranque rápido, aterragem suave.
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
