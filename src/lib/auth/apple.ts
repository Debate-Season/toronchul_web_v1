// ── Apple OAuth 유틸 ─────────────────────────────

const APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize";
const STATE_KEY = "apple_oauth_state";

/** Apple 인증 페이지로 리다이렉트 (state 파라미터 포함) */
export function redirectToApple() {
  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId ?? "",
    redirect_uri: redirectUri ?? "",
    response_type: "code id_token",
    response_mode: "form_post",
    scope: "name email",
    state,
  });

  window.location.href = `${APPLE_AUTH_URL}?${params.toString()}`;
}

/**
 * 콜백에서 state 파라미터 검증.
 * 유효하면 sessionStorage 에서 제거 후 true 반환.
 */
export function verifyAppleOAuthState(stateFromUrl: string | null): boolean {
  const saved = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);

  if (!saved || !stateFromUrl) return false;
  return saved === stateFromUrl;
}
