#!/usr/bin/env node
/**
 * design-system/build.js
 *
 * tokens.json → tailwind.config.ts + de_colors.dart
 * 디자인 토큰의 Single Source of Truth 빌드 스크립트
 */
const fs = require("fs");
const path = require("path");

// ── 경로 ──────────────────────────────────────────
const TOKENS_PATH = path.join(__dirname, "tokens.json");
const TAILWIND_PATH = path.resolve(__dirname, "..", "tailwind.config.ts");
const DART_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "debateseason_frontend_v1",
  "lib",
  "core",
  "constants",
  "de_colors.dart"
);

// ── 토큰 읽기 ────────────────────────────────────
const { colors } = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"));

// ══════════════════════════════════════════════════
//  HEX 변환 유틸
// ══════════════════════════════════════════════════

/** #RRGGBB → 그대로 | #RRGGBBAA → rgba(r, g, b, a) */
function hexToCss(hex) {
  if (hex.length === 9) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = (parseInt(hex.slice(7, 9), 16) / 255).toFixed(2);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return hex;
}

/** #RRGGBB → 0xFFRRGGBB | #RRGGBBAA → 0xAARRGGBB */
function hexToFlutter(hex) {
  const raw = hex.slice(1).toUpperCase();
  if (raw.length === 8) {
    return `0x${raw.slice(6)}${raw.slice(0, 6)}`;
  }
  return `0xFF${raw}`;
}

// ══════════════════════════════════════════════════
//  Tailwind 색상 그룹핑
// ══════════════════════════════════════════════════

const GROUP_PREFIXES = ["grey", "trans", "brand", "red", "blue", "image"];

/** camelCase 접미사 → kebab-case (숫자는 그대로) */
function camelToKebab(s) {
  if (/^\d+$/.test(s)) return s;
  return s
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
    .replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
}

/** flat tokens.json → { groups: { grey: {10: ..}, ... }, flat: { white: .., ... } } */
function groupColors() {
  const groups = {};
  const flat = {};
  const used = new Set();

  for (const prefix of GROUP_PREFIXES) {
    const g = {};
    for (const [key, val] of Object.entries(colors)) {
      if (key === prefix) {
        g["DEFAULT"] = hexToCss(val);
        used.add(key);
      } else if (
        key.startsWith(prefix) &&
        key.length > prefix.length &&
        /[A-Z0-9]/.test(key[prefix.length])
      ) {
        g[camelToKebab(key.slice(prefix.length))] = hexToCss(val);
        used.add(key);
      }
    }
    if (Object.keys(g).length) groups[prefix] = g;
  }

  for (const [key, val] of Object.entries(colors)) {
    if (!used.has(key)) flat[key] = hexToCss(val);
  }

  return { groups, flat };
}

// ══════════════════════════════════════════════════
//  1) tailwind.config.ts 생성
// ══════════════════════════════════════════════════

function buildTailwind() {
  const { groups, flat } = groupColors();
  const I = "        ";
  const I2 = "          ";

  function q(k) {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
  }

  // 출력 순서 (기존 tailwind.config.ts와 동일)
  const order = [
    { type: "flat", key: "white" },
    { type: "group", key: "grey" },
    { type: "group", key: "trans" },
    { type: "group", key: "brand" },
    { type: "flat", key: "tag" },
    { type: "group", key: "red" },
    { type: "group", key: "blue" },
    { type: "group", key: "image" },
    { type: "flat", key: "kakao" },
  ];

  const lines = [];
  const ordered = new Set(order.map((o) => o.key));

  for (const { type, key } of order) {
    if (type === "flat" && flat[key] != null) {
      lines.push("");
      lines.push(`${I}${key}: "${flat[key]}",`);
    } else if (type === "group" && groups[key]) {
      lines.push("");
      lines.push(`${I}${key}: {`);
      for (const [k, v] of Object.entries(groups[key])) {
        lines.push(`${I2}${q(k)}: "${v}",`);
      }
      lines.push(`${I}},`);
    }
  }

  // order에 포함되지 않은 나머지 토큰 (확장성)
  for (const [key, val] of Object.entries(flat)) {
    if (!ordered.has(key)) {
      lines.push("");
      lines.push(`${I}${key}: "${val}",`);
    }
  }

  const colorsBlock = lines.join("\n");

  const output = `import type { Config } from "tailwindcss";

/**
 * 토론철 디자인 시스템(TDS) - Tailwind CSS 설정
 *
 * ⚠️  이 파일은 design-system/build.js가 자동 생성합니다.
 *     직접 수정하지 마세요. tokens.json을 수정한 뒤 빌드하세요.
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
      /* ── Colors (auto-generated from tokens.json) ── */
      colors: {${colorsBlock}
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
`;

  fs.writeFileSync(TAILWIND_PATH, output, "utf-8");
}

// ══════════════════════════════════════════════════
//  2) de_colors.dart 생성
// ══════════════════════════════════════════════════

function buildDart() {
  const lines = [
    "import 'package:flutter/material.dart';",
    "",
    "/// 토론철 디자인 시스템 색상 토큰",
    "///",
    "/// ⚠️  이 파일은 design-system/build.js가 자동 생성합니다.",
    "///     직접 수정하지 마세요. tokens.json을 수정한 뒤 빌드하세요.",
    "class DeColors {",
    "  DeColors._();",
    "",
  ];

  for (const [key, hex] of Object.entries(colors)) {
    lines.push(`  static const ${key} = Color(${hexToFlutter(hex)});`);
  }

  lines.push("}");
  lines.push("");

  const dartDir = path.dirname(DART_PATH);
  if (!fs.existsSync(dartDir)) {
    fs.mkdirSync(dartDir, { recursive: true });
  }
  fs.writeFileSync(DART_PATH, lines.join("\n"), "utf-8");
}

// ══════════════════════════════════════════════════
//  실행
// ══════════════════════════════════════════════════

buildTailwind();
buildDart();
console.log("✅ 디자인 토큰 빌드 완료 (웹, 앱 동기화)");
