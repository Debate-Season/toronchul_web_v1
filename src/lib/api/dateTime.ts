/**
 * 백엔드 시각 필드 정규화.
 *
 * 백엔드 시각은 대부분 `yyyy-MM-dd'T'HH:mm:ss`(Asia/Seoul, 오프셋 없음) 문자열이지만,
 * `@JsonFormat` 이 빠진 필드는 Jackson 기본 직렬화로 `[2026,10,19,3,48,27,937427000]`
 * 같은 **배열**이 온다. Swagger 는 둘 다 `date-time` 문자열이라고 적는다. 배열을 문자열로
 * 믿고 쓰면 화면이 깨지거나(문자열 메서드 예외 → 500) 숫자가 이어 붙은 글자가 보인다.
 *
 * 확인된 필드 (2026-10-19 백엔드 전수 확인):
 * - `WikiResponse.updatedAt` — 백엔드 PR #221 로 문자열 수정 예정
 * - `UserTermsAgreementResponse.agreedAt` — 앱 호환 때문에 배열 유지
 */

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * 문자열이면 그대로, Jackson 배열 `[y, M, d, H?, m?, s?, nano?]` 이면
 * `yyyy-MM-ddTHH:mm:ss` 로 조립한다. 그 밖은 null.
 */
export function toBackendDateTime(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.every((n): n is number => typeof n === "number" && Number.isInteger(n))
  ) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = value;
    return `${y}-${pad2(mo)}-${pad2(d)}T${pad2(h)}:${pad2(mi)}:${pad2(s)}`;
  }
  return null;
}
