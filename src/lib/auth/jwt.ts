/**
 * 액세스 토큰에서 내 user_id 를 꺼낸다.
 *
 * **서명은 검증하지 않는다.** 여기서 얻은 값은 화면 표시(내 메시지 구분) 용도로만
 * 쓰고, 권한 판단에 쓰면 안 된다 — 권한은 서버가 토큰을 검증해서 정한다.
 *
 * 지금 이 값이 필요한 이유는 `GET /profiles/me` 응답에 user_id 가 없어서다.
 * 프로필 응답에 id 가 생기면 그쪽을 쓰는 편이 낫다.
 */
export function userIdFromToken(token: string | null | undefined): number | null {
  if (!token) return null;

  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    // JWT 는 base64url — `+/` 대신 `-_` 를 쓰고 패딩(`=`)이 없다.
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    // atob 결과를 그대로 JSON.parse 하면 payload 에 한글 등 비ASCII 가 섞였을 때
    // 깨진다. 바이트로 되돌린 뒤 UTF-8 로 디코딩한다.
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));

    if (typeof parsed !== "object" || parsed === null) return null;
    const sub = (parsed as Record<string, unknown>).sub;

    // `sub` 는 JWT 표준상 **문자열**이고, 응답의 `userId` 는 JSON 숫자다.
    // 비교하려면 여기서 숫자로 맞춰야 한다.
    const id = typeof sub === "string" || typeof sub === "number" ? Number(sub) : NaN;
    return Number.isInteger(id) ? id : null;
  } catch {
    // 형식이 다르거나 디코딩 실패 — 판별 불가로 다룬다(내 메시지 표시만 빠진다).
    return null;
  }
}
