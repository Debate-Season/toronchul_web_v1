// public/icons/favicon.png -> src/app/{favicon.ico, icon.png, apple-icon.png}
//
//   node scripts/generate-app-icons.mjs
//
// 탭에 그려지는 파비콘의 물리적 크기는 브라우저가 고정한다(16 CSS px, HiDPI 32px).
// 우리가 조절할 수 있는 건 그 고정된 타일 안에서 마크가 차지하는 비율뿐이다.
// 그래서 원본 앱 아이콘의 검정 배경판을 키잉으로 걷어내고 말풍선만 남긴다.
// 배경판을 두면 그만큼 마크가 작아지고, 다크 테마 탭에서는 그 판이 배경에
// 묻혀 마크가 더 작아 보인다.
//
// apple-icon 은 예외다. iOS 는 투명 픽셀을 검정으로 합성하고 자체 마스크를
// 씌우므로 불투명 정사각 타일이어야 한다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodePNG, encodePNG, canvas, crop, resize, blend,
  contentBounds, keyOutBackground, alphaBounds,
} from "./lib/png.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public/icons/favicon.png");

const MASTER = 512;
const GLYPH_FILL = 0.96;   // 투명 파비콘: 마크가 타일을 거의 꽉 채운다
const APPLE_FILL = 0.72;   // iOS 앱 아이콘 관례상 여백을 남긴다
const APPLE_SIZE = 180;
const ICO_SIZES = [16, 32, 48, 64, 128, 256];

const src = decodePNG(fs.readFileSync(SRC));
const bg = contentBounds(src).bg;
const keyed = keyOutBackground(src, bg);
const box = alphaBounds(keyed);
console.log(
  `source ${src.width}x${src.height}, bg rgb(${bg.join(",")}), ` +
  `glyph ${box.width}x${box.height} (${((box.width / src.width) * 100).toFixed(1)}% width)`
);

const glyph = crop(keyed, box.x, box.y, box.width, box.height);

/** 글리프를 fill 비율로 키워 정사각 캔버스 중앙에 놓는다. */
function compose(fill, background) {
  const scale = (MASTER * fill) / Math.max(box.width, box.height);
  const gw = Math.round(box.width * scale);
  const gh = Math.round(box.height * scale);
  const out = canvas(MASTER, MASTER, background);
  blend(out, resize(glyph, gw, gh), Math.round((MASTER - gw) / 2), Math.round((MASTER - gh) / 2));
  return out;
}

/** 2의 거듭제곱으로 반씩 줄인 뒤 나머지를 보간한다(512->16 직행보다 훨씬 깨끗). */
function downscale(img, size) {
  let cur = img;
  while (cur.width >= size * 2) cur = resize(cur, cur.width >> 1, cur.height >> 1);
  return cur.width === size ? cur : resize(cur, size, size);
}

// ── icon.png: 투명 배경, 마크 최대 ──────────────────────────
const mark = compose(GLYPH_FILL, [0, 0, 0, 0]);
const iconPath = path.join(ROOT, "src/app/icon.png");
fs.writeFileSync(iconPath, encodePNG(mark));
console.log(`wrote ${path.relative(ROOT, iconPath)} ${MASTER}x${MASTER} (transparent)`);

// ── apple-icon.png: 불투명 정사각 타일 ──────────────────────
const applePath = path.join(ROOT, "src/app/apple-icon.png");
fs.writeFileSync(applePath, encodePNG(downscale(compose(APPLE_FILL, [...bg, 255]), APPLE_SIZE), { alpha: false }));
console.log(`wrote ${path.relative(ROOT, applePath)} ${APPLE_SIZE}x${APPLE_SIZE} (opaque)`);

// ── favicon.ico: PNG 를 그대로 품는 다해상도 ICO ────────────
const images = ICO_SIZES.map((size) => ({ size, data: encodePNG(downscale(mark, size)) }));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(images.length, 4);

const entries = Buffer.alloc(16 * images.length);
let offset = 6 + entries.length;
images.forEach((img, i) => {
  const b = i * 16;
  entries.writeUInt8(img.size >= 256 ? 0 : img.size, b + 0); // width (0 = 256)
  entries.writeUInt8(img.size >= 256 ? 0 : img.size, b + 1); // height
  entries.writeUInt8(0, b + 2); // palette
  entries.writeUInt8(0, b + 3); // reserved
  entries.writeUInt16LE(1, b + 4); // color planes
  entries.writeUInt16LE(32, b + 6); // bits per pixel
  entries.writeUInt32LE(img.data.length, b + 8);
  entries.writeUInt32LE(offset, b + 12);
  offset += img.data.length;
});

const icoPath = path.join(ROOT, "src/app/favicon.ico");
fs.writeFileSync(icoPath, Buffer.concat([header, entries, ...images.map((i) => i.data)]));
console.log(`wrote ${path.relative(ROOT, icoPath)} (${offset} bytes, ${ICO_SIZES.join("/")})`);
