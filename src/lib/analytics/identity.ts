/**
 * 액세스 토큰에서 분석용 식별자를 꺼낸다.
 *
 * **왜 JWT 를 파싱하는가** — 백엔드가 클라이언트에 user id 를 주지 않는다.
 * 운영 Swagger 실측 기준 `LoginResponse`·`ProfileResponse` 어디에도 id 필드가
 * 없다. 반면 액세스 토큰은 JWT 이고 클레임이 `[sub, iat, exp, type, role]` 이라
 * `sub` 가 사실상 유일한 안정적 식별자다(v0.8.0 PRD §3.3).
 *
 * **서명은 검증하지 않는다.** 여기서 얻는 값은 분석 식별자일 뿐 권한 판단이
 * 아니다. 위조된 토큰이면 분석 데이터가 틀릴 뿐 보안 경계가 아니다.
 *
 * ⚠️ 토큰 포맷에 결합돼 있다. 백엔드가 클레임을 바꾸면 식별이 **조용히**
 * 끊긴다 — 그래서 모든 실패 경로가 `null` 로 떨어지고, 정식 `userId` 필드를
 * 백엔드에 요청해둔 상태다(PRD §7-4).
 */

export interface AnalyticsIdentity {
  /** PostHog distinct ID. JWT `sub`. */
  distinctId: string;
  /** person property 로 실어 내부 계정(ADMIN) 트래픽을 걸러내는 데 쓴다. */
  role: string | null;
}

/** base64url → 문자열. 실패하면 null. */
function decodeBase64Url(segment: string): string | null {
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    // atob 는 latin1 을 내므로 UTF-8 로 다시 읽는다. sub/role 은 ASCII 지만
    // 클레임이 늘어나도 깨지지 않도록.
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** 문자열이거나 숫자면 문자열로, 아니면 null. */
function asIdString(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

/**
 * 토큰에서 식별 정보를 읽는다. 토큰이 없거나 JWT 가 아니거나 `sub` 가 없으면
 * `null` — 호출부는 그때 익명으로 두면 된다.
 */
export function readIdentity(token: string | null): AnalyticsIdentity | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const json = decodeBase64Url(parts[1]);
  if (!json) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(json);
  } catch {
    return null;
  }

  if (typeof payload !== "object" || payload === null) return null;

  const claims = payload as Record<string, unknown>;
  const distinctId = asIdString(claims.sub);
  if (!distinctId) return null;

  return { distinctId, role: asIdString(claims.role) };
}
