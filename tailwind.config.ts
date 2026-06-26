import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base neutra: gris piedra cálido, no el gris azulado genérico de SaaS
        ink: {
          950: "#15130F",
          900: "#211E18",
          800: "#343026",
          700: "#4A453A",
          600: "#675F50",
          500: "#8B8270",
          400: "#AFA690",
          300: "#D2C9B4",
          200: "#E6E0CF",
          100: "#F2EEE2",
          50: "#FAF8F1",
        },
        // Acento institucional: azul bandera Venezuela, desaturado para uso UI
        bandera: {
          900: "#0B2A4A",
          800: "#0F3A66",
          700: "#15497E",
          600: "#1C5C9C",
          500: "#2B72B8",
          400: "#5C95CC",
        },
        // Estados operativos — estos colores son funcionales, no decorativos
        estado: {
          critico: "#C23B2E",
          "critico-bg": "#FBEAE7",
          donacion: "#2E8B57",
          "donacion-bg": "#E8F4ED",
          persona: "#2B5FAD",
          "persona-bg": "#E8EFF8",
          riesgo: "#D6A019",
          "riesgo-bg": "#FBF3DF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px 0 rgba(21,19,15,0.06), 0 1px 12px -2px rgba(21,19,15,0.10)",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
      },
      animation: {
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slide-in 0.18s ease-out",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "70%": { transform: "scale(1.8)", opacity: "0" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-8px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
