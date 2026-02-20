import type { Config } from "tailwindcss";

/**
 * 토론철 디자인 시스템(TDS) - Tailwind CSS 설정
 *
 * Flutter de_colors.dart + de_fonts.dart 기반
 * 컬러·타이포그래피 토큰을 Tailwind 유틸리티로 매핑
 *
 * ─── 컬러 사용 예시 ──────────────────────
 *   bg-brand, text-grey-50, border-red, bg-blue-dark 등
 *
 * ─── 타이포그래피 사용 예시 ──────────────
 *   text-header-24 font-bold     → header24B
 *   text-body-16 font-semibold   → body16Sb
 *   text-body-14 font-medium     → body14M
 *   text-caption-12 font-normal  → caption12R
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ── Colors ─────────────────────────────── */
      colors: {
        white: "#FFFFFF",

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

        trans: {
          30: "rgba(0, 0, 0, 0.30)",
          50: "rgba(0, 0, 0, 0.50)",
        },

        brand: {
          DEFAULT: "#996BFA",
          dark: "#7E66B0",
          disable: "#A590D0",
          trans: "rgba(153, 107, 250, 0.80)",
        },

        tag: "#3D2E5A",

        red: {
          DEFAULT: "#FF5C62",
          light: "#FFB9BB",
          "dark-on-grey": "#4C3942",
          dark: "#382125",
          mine: "#654654",
        },

        blue: {
          DEFAULT: "#5A61FF",
          "dark-on-grey": "#3C3A51",
          dark: "#242345",
          mine: "#4F4C71",
        },

        image: {
          red: "#FE2222",
          orange: "#FF813D",
          yellow: "#FFE93F",
          green: "#2CCD3F",
          blue: "#371DFF",
          navy: "#350FC1",
          purple: "#9500AF",
        },

        kakao: "#FEE500",
      },

      /* ── Typography ─────────────────────────── */
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },

      fontSize: {
        /** 48px / line 1.0 / ls -1.2px — largest (Bold) */
        largest: [
          "48px",
          { lineHeight: "1", letterSpacing: "-1.2px" },
        ],
        /** 28px / line 1.5 / ls -0.7px — header28Sb */
        "header-28": [
          "28px",
          { lineHeight: "1.5", letterSpacing: "-0.7px" },
        ],
        /** 24px / line 1.5 / ls -0.6px — header24B */
        "header-24": [
          "24px",
          { lineHeight: "1.5", letterSpacing: "-0.6px" },
        ],
        /** 20px / line 1.4 / ls -0.5px — header20B */
        "header-20": [
          "20px",
          { lineHeight: "1.4", letterSpacing: "-0.5px" },
        ],
        /** 18px / line 1.4 / ls -0.45px — header18Sb */
        "header-18": [
          "18px",
          { lineHeight: "1.4", letterSpacing: "-0.45px" },
        ],
        /** 16px / line 1.5 / ls -0.4px — body16 (Sb/M/R) */
        "body-16": [
          "16px",
          { lineHeight: "1.5", letterSpacing: "-0.4px" },
        ],
        /** 14px / line 1.5 / ls -0.35px — body14 (Sb/M/R) */
        "body-14": [
          "14px",
          { lineHeight: "1.5", letterSpacing: "-0.35px" },
        ],
        /** 12px / line 1.5 / ls -0.3px — caption12 (SB/M/R) */
        "caption-12": [
          "12px",
          { lineHeight: "1.5", letterSpacing: "-0.3px" },
        ],
        /** 12px / line 1.2 / ls -0.3px — caption12M2 (tight) */
        "caption-12-tight": [
          "12px",
          { lineHeight: "1.2", letterSpacing: "-0.3px" },
        ],
      },
    },
  },
  plugins: [],
};

export default config;
