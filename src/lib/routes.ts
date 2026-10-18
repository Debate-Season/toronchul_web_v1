/**
 * 색인 대상 URL 의 유일한 조립·판정 경로 (PRD v0.9.0 §4).
 *
 * 스킴은 `/{entity}/{b36}` — 슬러그 없이 백엔드 정수 id 를 소문자 base36 으로 쓴다.
 * 정체성은 id 뿐이라 제목이 바뀌어도 URL 은 그대로다.
 */

/** 숫자 → 소문자 base36 */
export function toBase36(id: number): string {
  return id.toString(36);
}

/** base36 → 숫자. 형식 검증이 필요하면 `parseEntityId` 를 쓴다 */
export function fromBase36(b36: string): number {
  return parseInt(b36, 36);
}

/**
 * URL 세그먼트를 엔티티 id 로 판정한다 (PRD §4.3d).
 *
 * - 정식형이 아니어도 대소문자만 다르면 소문자형 `segment` 를 돌려준다 → 호출부가 308
 * - 선행 0(`0q`)·잘못된 문자·0 이하는 null → 404. 별칭에 리다이렉트를 주면
 *   유효한 URL 이 무한히 생기므로 아예 막는다
 */
export function parseEntityId(
  segment: string,
): { id: number; segment: string } | null {
  const lower = segment.toLowerCase();
  if (!/^[0-9a-z]+$/.test(lower)) return null;
  const id = fromBase36(lower);
  if (!Number.isSafeInteger(id) || id <= 0 || toBase36(id) !== lower) {
    return null;
  }
  return { id, segment: lower };
}

/** 이슈 상세 경로 */
export function issueHref(issueId: number): string {
  return `/issue/${toBase36(issueId)}`;
}

/**
 * 토론 상세 경로. 토론방은 이슈당 하나이고 스레드(토론 주제)가 열릴 탭을 정한다.
 * 상위 이슈는 경로에 없다 — 페이지가 `GET /api/v1/room` 의 `issueId` 로 찾는다.
 */
export function debateHref(threadId: number): string {
  return `/debate/${toBase36(threadId)}`;
}
