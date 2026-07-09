import { apiFetch } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────
export interface Community {
  id: number;
  name: string;
  iconUrl: string;
}

/** GET /api/v1/profiles/me 응답 */
export interface MyProfile {
  profileImage: string;
  nickname: string;
  gender: string;
  ageRange: string;
  community: Community;
  residenceProvince: string;
  residenceDistrict: string;
  hometownProvince: string;
  hometownDistrict: string;
}

/** 프로필 생성/수정 입력. 지역은 code 문자열(예: "11","11010"), 미선택은 null. */
export interface ProfilePayload {
  nickname: string;
  communityId: number;
  gender: string;
  ageRange: string;
  residenceProvince?: string | null;
  residenceDistrict?: string | null;
  hometownProvince?: string | null;
  hometownDistrict?: string | null;
}

export type NicknameCheckResult = "available" | "duplicate" | "invalid";

// ── API ───────────────────────────────────────────

/** GET /api/v1/profiles/me — 내 프로필 조회 */
export async function getMyProfile(token: string | null): Promise<MyProfile> {
  return apiFetch<MyProfile>("/api/v1/profiles/me", { token });
}

/**
 * POST /api/v1/profiles — 프로필 생성(신규가입).
 * null·빈문자열 필드는 키 자체를 제거 (모바일 toJsonForPost 미러).
 */
export async function createProfile(
  payload: ProfilePayload,
  token: string | null,
): Promise<void> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined || value === "") continue;
    body[key] = value;
  }
  await apiFetch<null>("/api/v1/profiles", {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });
}

/**
 * PATCH /api/v1/profiles — 프로필 수정.
 * null 은 빈문자열로 치환하여 모든 키 전송 (모바일 toJsonForPatch 미러).
 */
export async function updateProfile(
  payload: ProfilePayload,
  token: string | null,
): Promise<void> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    body[key] = value === null || value === undefined ? "" : value;
  }
  await apiFetch<null>("/api/v1/profiles", {
    method: "PATCH",
    body: JSON.stringify(body),
    token,
  });
}

/** PATCH /api/v1/profiles/image — 프로필 색상(engName) 변경 */
export async function updateProfileImage(
  profileImage: string,
  token: string | null,
): Promise<void> {
  await apiFetch<null>("/api/v1/profiles/image", {
    method: "PATCH",
    body: JSON.stringify({ profileImage }),
    token,
  });
}

/**
 * GET /api/v1/profiles/nickname/check?query= — 닉네임 사용 가능 여부.
 * 성공(2xx)=available. 실패 응답 code 로 duplicate/invalid 판별
 * (DUPLICATE_NICKNAME/409 → duplicate, 그 외 → invalid). 모바일 200/409/else 미러.
 */
export async function checkNickname(
  nickname: string,
  token: string | null,
): Promise<NicknameCheckResult> {
  try {
    await apiFetch<null>(
      `/api/v1/profiles/nickname/check?query=${encodeURIComponent(nickname)}`,
      { token },
    );
    return "available";
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("DUPLICATE_NICKNAME") || msg.includes("[409]")) {
      return "duplicate";
    }
    return "invalid";
  }
}

/** GET /api/v1/communities — 전체 커뮤니티 목록 */
export async function getCommunities(token: string | null): Promise<Community[]> {
  return apiFetch<Community[]>("/api/v1/communities", { token });
}

/** GET /api/v1/communities/search?query= — 커뮤니티 검색 */
export async function searchCommunities(
  query: string,
  token: string | null,
): Promise<Community[]> {
  return apiFetch<Community[]>(
    `/api/v1/communities/search?query=${encodeURIComponent(query)}`,
    { token },
  );
}

/** POST /api/v1/users/withdraw — 회원 탈퇴 */
export async function withdraw(token: string | null): Promise<void> {
  await apiFetch<null>("/api/v1/users/withdraw", { method: "POST", token });
}
