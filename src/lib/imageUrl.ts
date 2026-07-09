// ── 이미지 URL 조립 ───────────────────────────────────────
// 백엔드는 이미지 필드를 상대경로로만 반환한다 (예: "community/icons/dcinside.png").
// 여기에 이미지 base(NEXT_PUBLIC_IMAGE_URL, 예 "https://api.toronchul.app/images/")를 붙인다.
// 모바일 DeCachedImage 의 `${IMAGE_BASE_URL}$imageUrl` 미러.

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "/images/";

/**
 * 상대경로에 이미지 base 를 붙여 전체 URL 을 만든다.
 * 이미 절대 URL(http/https)이면 그대로 반환.
 */
export function imageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;

  const base = IMAGE_BASE.endsWith("/") ? IMAGE_BASE : `${IMAGE_BASE}/`;
  const rel = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${rel}`;
}
