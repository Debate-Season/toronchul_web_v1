// 리포에 이미지 라이브러리가 없어서 zlib 만으로 PNG 를 직접 다룬다.
// 브랜드 자산 생성 스크립트(generate-app-icons / generate-og-image)가 공유한다.
import zlib from "node:zlib";

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/** PNG -> {width, height, data:RGBA8}. 8bit / non-interlaced 만 지원한다. */
export function decodePNG(buf) {
  let pos = 8; // 시그니처 건너뛰기
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  let palette = null, trns = null;

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error("interlaced PNG unsupported");
    } else if (type === "PLTE") palette = Buffer.from(data);
    else if (type === "tRNS") trns = Buffer.from(data);
    else if (type === "IDAT") idat.push(Buffer.from(data));
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`bit depth ${bitDepth} unsupported`);

  const bpp = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!bpp) throw new Error(`color type ${colorType} unsupported`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const s = i * bpp, d = i * 4;
    if (colorType === 6) { rgba[d]=out[s]; rgba[d+1]=out[s+1]; rgba[d+2]=out[s+2]; rgba[d+3]=out[s+3]; }
    else if (colorType === 2) { rgba[d]=out[s]; rgba[d+1]=out[s+1]; rgba[d+2]=out[s+2]; rgba[d+3]=255; }
    else if (colorType === 0) { rgba[d]=rgba[d+1]=rgba[d+2]=out[s]; rgba[d+3]=255; }
    else if (colorType === 4) { rgba[d]=rgba[d+1]=rgba[d+2]=out[s]; rgba[d+3]=out[s+1]; }
    else if (colorType === 3) {
      const p = out[s] * 3;
      rgba[d]=palette[p]; rgba[d+1]=palette[p+1]; rgba[d+2]=palette[p+2];
      rgba[d+3] = trns && out[s] < trns.length ? trns[out[s]] : 255;
    }
  }
  return { width, height, data: rgba };
}

/** {width,height,data:RGBA8} -> PNG. alpha=false 면 RGB 로 인코딩(파일 크기 절약). */
export function encodePNG(img, { alpha = true } = {}) {
  const { width, height, data } = img;
  const ch = alpha ? 4 : 3;
  const stride = width * ch;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4, d = y * (stride + 1) + 1 + x * ch;
      raw[d] = data[s]; raw[d + 1] = data[s + 1]; raw[d + 2] = data[s + 2];
      if (alpha) raw[d + 3] = data[s + 3];
    }
  }
  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length, 0);
    const payload = Buffer.concat([Buffer.from(type, "ascii"), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(payload), 0);
    return Buffer.concat([len, payload, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = alpha ? 6 : 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** 빈 캔버스. fill 은 [r,g,b,a]. */
export function canvas(width, height, fill = [0, 0, 0, 0]) {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i*4]=fill[0]; data[i*4+1]=fill[1]; data[i*4+2]=fill[2]; data[i*4+3]=fill[3];
  }
  return { width, height, data };
}

/** src 의 (sx,sy,sw,sh) 영역만 잘라낸다. */
export function crop(src, sx, sy, sw, sh) {
  const out = canvas(sw, sh);
  for (let y = 0; y < sh; y++) {
    src.data.copy(out.data, y * sw * 4, ((sy + y) * src.width + sx) * 4, ((sy + y) * src.width + sx + sw) * 4);
  }
  return out;
}

/** 바이리니어 리샘플. 알파 프리멀티플로 계산해 가장자리 후광을 막는다. */
export function resize(src, dw, dh) {
  const { width: sw, height: sh, data } = src;
  const out = canvas(dw, dh);
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, Math.max(0, (y + 0.5) * (sh / dh) - 0.5));
    const y0 = Math.floor(sy), y1 = Math.min(sh - 1, y0 + 1), fy = sy - y0;
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, Math.max(0, (x + 0.5) * (sw / dw) - 0.5));
      const x0 = Math.floor(sx), x1 = Math.min(sw - 1, x0 + 1), fx = sx - x0;
      const w = [(1-fx)*(1-fy), fx*(1-fy), (1-fx)*fy, fx*fy];
      const idx = [(y0*sw+x0)*4, (y0*sw+x1)*4, (y1*sw+x0)*4, (y1*sw+x1)*4];
      let r = 0, g = 0, b = 0, a = 0;
      for (let k = 0; k < 4; k++) {
        const al = data[idx[k] + 3] / 255;
        r += data[idx[k]] * al * w[k];
        g += data[idx[k] + 1] * al * w[k];
        b += data[idx[k] + 2] * al * w[k];
        a += al * w[k];
      }
      const d = (y * dw + x) * 4;
      out.data[d]   = a > 0 ? Math.round(r / a) : 0;
      out.data[d+1] = a > 0 ? Math.round(g / a) : 0;
      out.data[d+2] = a > 0 ? Math.round(b / a) : 0;
      out.data[d+3] = Math.round(a * 255);
    }
  }
  return out;
}

/** layer 를 dst 의 (ox,oy) 에 알파 합성한다. */
export function blend(dst, layer, ox, oy) {
  for (let y = 0; y < layer.height; y++) {
    const cy = oy + y;
    if (cy < 0 || cy >= dst.height) continue;
    for (let x = 0; x < layer.width; x++) {
      const cx = ox + x;
      if (cx < 0 || cx >= dst.width) continue;
      const s = (y * layer.width + x) * 4, d = (cy * dst.width + cx) * 4;
      const sa = layer.data[s + 3] / 255;
      if (sa === 0) continue;
      const da = dst.data[d + 3] / 255;
      const oa = sa + da * (1 - sa);
      for (let c = 0; c < 3; c++) {
        dst.data[d + c] = Math.round((layer.data[s + c] * sa + dst.data[d + c] * da * (1 - sa)) / oa);
      }
      dst.data[d + 3] = Math.round(oa * 255);
    }
  }
  return dst;
}

/**
 * 라운드 사각형 마스크를 알파에 곱한다. radius 는 px.
 * 4x4 슈퍼샘플링으로 가장자리를 안티에일리어싱한다.
 */
export function roundCorners(img, radius) {
  const { width: w, height: h } = img;
  const S = 4, inv = 1 / S;
  const inside = (px, py) => {
    // 모서리 원의 중심까지 거리로 판정
    const cx = px < radius ? radius : px > w - radius ? w - radius : px;
    const cy = py < radius ? radius : py > h - radius ? h - radius : py;
    const dx = px - cx, dy = py - cy;
    return dx * dx + dy * dy <= radius * radius;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let hits = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          if (inside(x + (sx + 0.5) * inv, y + (sy + 0.5) * inv)) hits++;
        }
      }
      if (hits === S * S) continue;
      const d = (y * w + x) * 4;
      img.data[d + 3] = Math.round(img.data[d + 3] * (hits / (S * S)));
    }
  }
  return img;
}

/** 배경색과 다른 픽셀들의 바운딩 박스. 여백을 잘라낼 때 쓴다. */
export function contentBounds(img, threshold = 24) {
  const bg = [img.data[0], img.data[1], img.data[2]];
  let minX = img.width, minY = img.height, maxX = -1, maxY = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const d = (y * img.width + x) * 4;
      const delta = Math.abs(img.data[d] - bg[0]) + Math.abs(img.data[d+1] - bg[1]) + Math.abs(img.data[d+2] - bg[2]);
      if (delta > threshold || img.data[d + 3] < 250) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1, bg };
}
