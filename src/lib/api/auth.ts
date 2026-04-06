import { apiFetch } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────
export interface LoginRequest {
  socialType: "kakao" | "apple";
  idToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  socialType: string;
  profileStatus: boolean;
  termsStatus: boolean;
}

export interface ReissueResponse {
  accessToken: string;
  refreshToken: string;
}

// ── API ───────────────────────────────────────────
export async function loginWithOidc(
  body: LoginRequest,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/v2/users/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** 토큰 갱신 — POST /api/v1/auth/reissue */
export async function reissueToken(
  refreshToken: string,
): Promise<ReissueResponse> {
  return apiFetch<ReissueResponse>("/api/v1/auth/reissue", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

/** 로그아웃 — POST /api/v1/users/logout */
export async function logoutFromServer(refreshToken: string): Promise<void> {
  await apiFetch<unknown>("/api/v1/users/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}
