// ── Kakao OAuth 유틸 ─────────────────────────────

const KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";
const STATE_KEY = "kakao_oauth_state";

/** 카카오 인증 페이지로 리다이렉트 (state 파라미터 포함) */
export function redirectToKakao() {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);

  const url =
    `${KAKAO_AUTH_URL}` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri ?? "")}` +
    `&response_type=code` +
    `&scope=openid` +
    `&state=${state}`;

  window.location.href = url;
}

/**
 * 콜백에서 state 파라미터 검증.
 * 유효하면 sessionStorage 에서 제거 후 true 반환.
 */
export function verifyOAuthState(stateFromUrl: string | null): boolean {
  const saved = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);

  if (!saved || !stateFromUrl) return false;
  return saved === stateFromUrl;
}

// ── 카카오 인가 코드 → id_token 교환 ──────────────
// 카카오 kauth 는 apiFetch 가 처리할 수 없는 서드파티 엔드포인트이므로 직접 fetch 사용.

const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";

interface KakaoTokenResponse {
  id_token?: string;
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
}

interface KakaoTokenError {
  error: string;
  error_description: string;
}

export async function exchangeCodeForIdToken(code: string): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? "";
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ?? "";

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errorBody: KakaoTokenError = await res.json().catch(() => ({
      error: "unknown",
      error_description: "카카오 토큰 교환 실패",
    }));
    throw new Error(`카카오 토큰 교환 실패 ${errorBody.error}`);
  }

  const data: KakaoTokenResponse = await res.json();

  if (!data.id_token) {
    throw new Error("id_token이 응답에 포함되어 있지 않습니다.");
  }

  return data.id_token;
}
