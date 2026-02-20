import type { Config } from "tailwindcss";

/**
 * 토론철 디자인 시스템(TDS) - Tailwind CSS 설정
 *
 * Flutter de_colors.dart 기반 컬러 토큰을 Tailwind 유틸리티로 매핑
 *
 * 사용 예시:
 *   bg-brand, text-grey-50, border-red, bg-blue-dark 등
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Base ─────────────────────────────────── */
        white: "#FFFFFF",

        /* ── Grey Scale ───────────────────────────── */
        grey: {
          10: "#EBE7ED",
          30: "#C5C1C7",
          50: "#7A7681",
          70: "#504B58",
          80: "#38353E",
          90: "#2E2B34",
          100: "#262226",
          110: "#1D1A1D",
          120: "#161416",
        },

        /* ── Transparency (Black) ─────────────────── */
        trans: {
          30: "rgba(0, 0, 0, 0.30)",
          50: "rgba(0, 0, 0, 0.50)",
        },

        /* ── Brand ────────────────────────────────── */
        brand: {
          DEFAULT: "#996BFA",
          dark: "#7E66B0",
          disable: "#A590D0",
          trans: "rgba(153, 107, 250, 0.80)",
        },

        /* ── Tag ──────────────────────────────────── */
        tag: "#3D2E5A",

        /* ── Red (찬성/Pro) ───────────────────────── */
        red: {
          DEFAULT: "#FF5C62",
          light: "#FFB9BB",
          "dark-on-grey": "#4C3942",
          dark: "#382125",
          mine: "#654654",
        },

        /* ── Blue (반대/Con) ──────────────────────── */
        blue: {
          DEFAULT: "#5A61FF",
          "dark-on-grey": "#3C3A51",
          dark: "#242345",
          mine: "#4F4C71",
        },

        /* ── Image Accent Colors ──────────────────── */
        image: {
          red: "#FE2222",
          orange: "#FF813D",
          yellow: "#FFE93F",
          green: "#2CCD3F",
          blue: "#371DFF",
          navy: "#350FC1",
          purple: "#9500AF",
        },

        /* ── Third-party ──────────────────────────── */
        kakao: "#FEE500",
      },
    },
  },
  plugins: [],
};

export default config;
