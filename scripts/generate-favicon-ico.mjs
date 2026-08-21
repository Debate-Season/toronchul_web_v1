// public/icons/favicon.png -> src/app/favicon.ico (다해상도)
//
//   node scripts/generate-favicon-ico.mjs
//
// PNG 를 그대로 품는 ICO 포맷. Windows Vista+ / 모든 현행 브라우저가 읽는다.
// 리사이즈는 macOS 기본 `sips` 를 쓴다(이미지 의존성 추가 없이).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public/icons/favicon.png");
const OUT = path.join(ROOT, "src/app/favicon.ico");
const SIZES = [16, 32, 48, 64, 128, 256];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "favicon-"));
const images = SIZES.map((size) => {
  const file = path.join(tmp, `${size}.png`);
  execFileSync("sips", ["-s", "format", "png", "-z", String(size), String(size), SRC, "--out", file], {
    stdio: "ignore",
  });
  return { size, data: fs.readFileSync(file) };
});

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

fs.writeFileSync(OUT, Buffer.concat([header, entries, ...images.map((i) => i.data)]));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`wrote ${path.relative(ROOT, OUT)} (${offset} bytes, ${SIZES.join("/")})`);
