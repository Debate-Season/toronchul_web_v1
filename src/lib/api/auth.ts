// ── Types ─────────────────────────────────────────
export interface LoginRequest {
  socialType: "kakao" | "apple";
  idToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  profileStatus: "INCOMPLETE" | "COMPLETE";
  termsStatus: "NOT_AGREED" | "AGREED";
}

// ── API ───────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function loginWithOidc(
  body: LoginRequest,
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/v2/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Login failed: ${res.status}`);
  }

  return res.json();
}
