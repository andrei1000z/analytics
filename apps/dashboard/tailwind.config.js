/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware semantic tokens (channel-triplet pattern → opacity modifiers work)
        "soft-bg": "rgb(var(--soft-bg) / <alpha-value>)",
        "soft-gray": "rgb(var(--soft-gray) / <alpha-value>)",
        "soft-elev": "rgb(var(--soft-elev) / <alpha-value>)",
        "text-main": "rgb(var(--text-main) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted) / <alpha-value>)",
        "text-faint": "rgb(var(--text-faint) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",

        // Brand accents — theme-stable hex
        "eu-blue": {
          DEFAULT: "#003399",
          light: "#3366cc",
          dark: "#001f5e",
          50: "#eef3ff",
          100: "#dce7ff",
          200: "#b9cfff",
          300: "#8fb0ff",
          400: "#5e8aff",
          500: "#3366cc",
          600: "#003399",
          700: "#002a82",
          800: "#001f5e",
          900: "#001740",
        },
        "eu-yellow": {
          DEFAULT: "#FFCC00",
          soft: "#FFE066",
          deep: "#E6B800",
        },
        signal: {
          good: "#16a34a",
          warn: "#f59e0b",
          bad: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        glass:
          "0 1px 0 0 rgba(255,255,255,0.6) inset, 0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px -20px rgba(15,23,42,0.18), 0 8px 24px -12px rgba(15,23,42,0.10)",
        "glass-dark":
          "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.02), 0 24px 60px -20px rgba(0,0,0,0.55)",
        "soft-1":
          "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px -6px rgba(15,23,42,0.08)",
        "soft-2":
          "0 2px 4px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.10)",
        "eu-glow":
          "0 0 0 4px rgba(0,51,153,0.10), 0 8px 24px -8px rgba(0,51,153,0.25)",
      },
      backdropBlur: {
        "3xl": "64px",
      },
      gridTemplateColumns: {
        // 24-column grid for the hour-by-hour heatmap row
        24: "repeat(24, minmax(0, 1fr))",
      },
    },
  },
  plugins: [],
};
