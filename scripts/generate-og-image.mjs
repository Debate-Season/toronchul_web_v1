// public/images/img_debate_logo.png -> public/og-image.png (1200x630, 1.91:1)
//
//   node scripts/generate-og-image.mjs
//
// og:image 를 명시하지 않으면 스크래퍼가 페이지에서 제일 큰 이미지(정사각
// 스플래시 로고)를 골라 1.91:1 카드에 맞추느라 좌우가 잘린다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodePNG, encodePNG, canvas, resize, blend } from "./lib/png.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public/images/img_debate_logo.png");
const OUT = path.join(ROOT, "public/og-image.png");

const W = 1200, H = 630;
const BAR = 10;              // 하단 브랜드 그라데이션 바
const LOGO_WIDTH = 600;      // 워드마크 원본이 336px 이라 그 이상 키우면 눈에 띄게 뭉갠다
const BG = [0x16, 0x14, 0x16]; // --color-grey-120
const GRAD = [
  [0xfe, 0x22, 0x22], // --color-image-red
  [0x99, 0x6b, 0xfa], // --color-brand
  [0x5a, 0x61, 0xff], // --color-blue
];

const card = canvas(W, H, [...BG, 255]);

for (let x = 0; x < W; x++) {
  const seg = (x / (W - 1)) * (GRAD.length - 1);
  const i = Math.min(GRAD.length - 2, Math.floor(seg));
  const f = seg - i;
  for (let y = H - BAR; y < H; y++) {
    const d = (y * W + x) * 4;
    for (let c = 0; c < 3; c++) card.data[d + c] = Math.round(GRAD[i][c] * (1 - f) + GRAD[i + 1][c] * f);
  }
}

const logo = decodePNG(fs.readFileSync(SRC));
const lh = Math.round((logo.height / logo.width) * LOGO_WIDTH);
blend(card, resize(logo, LOGO_WIDTH, lh), Math.round((W - LOGO_WIDTH) / 2), Math.round((H - BAR - lh) / 2));

fs.writeFileSync(OUT, encodePNG(card, { alpha: false }));
console.log(`wrote ${path.relative(ROOT, OUT)} ${W}x${H}`);
