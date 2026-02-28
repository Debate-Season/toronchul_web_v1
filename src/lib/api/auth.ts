import { api } from "@/lib/api/client";

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

// ── API ───────────────────────────────────────────
export async function loginWithOidc(
  body: LoginRequest,
): Promise<LoginResponse> {
  return api.post<LoginResponse>("/api/v2/users/login", body);
}
