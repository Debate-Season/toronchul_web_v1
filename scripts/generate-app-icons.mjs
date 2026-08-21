// public/icons/favicon.png -> src/app/{favicon.ico, icon.png, apple-icon.png}
//
//   node scripts/generate-app-icons.mjs
//
// 원본 앱 아이콘은 말풍선이 캔버스의 59% 폭만 차지한다. 그대로 16px 로 줄이면
// 글리프가 9px 밖에 안 돼서 탭에서 알아볼 수가 없다. 여백을 잘라내고 CONTENT_FILL
// 만큼 키운 뒤 라운드 코너를 씌운다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodePNG, encodePNG, canvas, crop, resize, blend, roundCorners, contentBounds,
} from "./lib/png.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public/icons/favicon.png");

const MASTER = 512;
const CONTENT_FILL = 0.78;   // 말풍선이 차지할 캔버스 비율 (원본 0.59)
const RADIUS_RATIO = 0.22;   // iOS 스퀘어클과 비슷한 정도
const ICO_SIZES = [16, 32, 48, 64, 128, 256];
const APPLE_SIZE = 180;

const src = decodePNG(fs.readFileSync(SRC));
const box = contentBounds(src);
console.log(
  `source ${src.width}x${src.height}, content ${box.width}x${box.height} ` +
  `(${((box.width / src.width) * 100).toFixed(1)}% width)`
);

/** 여백을 잘라 CONTENT_FILL 만큼 키운 정사각 캔버스. */
function buildMaster() {
  const glyph = crop(src, box.x, box.y, box.width, box.height);
  const target = MASTER * CONTENT_FILL;
  const scale = target / Math.max(box.width, box.height);
  const gw = Math.round(box.width * scale);
  const gh = Math.round(box.height * scale);
  const out = canvas(MASTER, MASTER, [...box.bg, 255]);
  blend(out, resize(glyph, gw, gh), Math.round((MASTER - gw) / 2), Math.round((MASTER - gh) / 2));
  return out;
}

/** 2의 거듭제곱으로 반씩 줄인 뒤 나머지를 보간한다(512->16 직행보다 훨씬 깨끗). */
function downscale(img, size) {
  let cur = img;
  while (cur.width >= size * 2) cur = resize(cur, cur.width >> 1, cur.height >> 1);
  return cur.width === size ? cur : resize(cur, size, size);
}

function clone(img) {
  return { width: img.width, height: img.height, data: Buffer.from(img.data) };
}

// ── icon.png / favicon.ico: 라운드 코너 ─────────────────────
const rounded = roundCorners(buildMaster(), MASTER * RADIUS_RATIO);
const iconPath = path.join(ROOT, "src/app/icon.png");
fs.writeFileSync(iconPath, encodePNG(rounded));
console.log(`wrote ${path.relative(ROOT, iconPath)} ${MASTER}x${MASTER}`);

// ── apple-icon.png: 정사각 풀블리드 ─────────────────────────
// iOS 가 자체 마스크를 씌우므로 우리가 라운드를 넣으면 모서리가 이중으로 깎인다.
const applePath = path.join(ROOT, "src/app/apple-icon.png");
fs.writeFileSync(applePath, encodePNG(downscale(buildMaster(), APPLE_SIZE), { alpha: false }));
console.log(`wrote ${path.relative(ROOT, applePath)} ${APPLE_SIZE}x${APPLE_SIZE}`);

// ── favicon.ico: PNG 를 그대로 품는 다해상도 ICO ────────────
const images = ICO_SIZES.map((size) => ({
  size,
  data: encodePNG(downscale(clone(rounded), size)),
}));

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
