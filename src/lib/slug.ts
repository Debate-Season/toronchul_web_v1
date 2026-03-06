/**
 * 한국어 제목을 URL slug로 변환.
 * - 공백/특수문자를 하이픈으로 치환
 * - 연속 하이픈 제거, 양쪽 하이픈 trim
 * - 한글·영문·숫자 유지
 */
export function toSlug(title: string): string {
  return title
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

/** 숫자 → base36 (짧은 ID) */
export function toBase36(id: number): string {
  return id.toString(36);
}

/** base36 → 숫자 */
export function fromBase36(b36: string): number {
  return parseInt(b36, 36);
}

/** 이슈 상세 경로 생성 */
export function issueHref(issueId: number, title: string): string {
  return `/issue/${toBase36(issueId)}/${toSlug(title)}`;
}

/** 토론방 상세 경로 생성 (이슈 하위) */
export function roomHref(
  issueId: number,
  issueTitle: string,
  roomId: number,
  roomTitle: string,
): string {
  return `/issue/${toBase36(issueId)}/${toSlug(issueTitle)}/${toBase36(roomId)}/${toSlug(roomTitle)}`;
}
