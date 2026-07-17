import { apiFetch } from "./client";

// ── Types (GET /api/v1/room) ─────────────────────

export interface TeamScore {
  team: string;
  total: number;
  logic: number;
  attitude: number;
  mvp: string | null;
}

export interface RoomDetailResponse {
  chatRoomId: number;
  title: string;
  content: string;
  agree: number;
  disagree: number;
  teams: TeamScore[];
  createdAt: string;
  opinion: string;
}

// ── API ──────────────────────────────────────────

export async function fetchRoomDetail(
  chatRoomId: number,
  token?: string | null,
): Promise<RoomDetailResponse> {
  return apiFetch<RoomDetailResponse>(
    `/api/v1/room?chatroom-id=${chatRoomId}`,
    { token },
  );
}

/** 투표 의견. RoomDetailResponse.opinion 이 이 값이면 투표 완료(NEUTRAL=미투표). */
export type VoteOpinion = "AGREE" | "DISAGREE";

/** POST /api/v1/room/vote — 찬반 투표(쿼리 파라미터, body 없음). 로그인 필요. */
export async function voteRoom(
  chatRoomId: number,
  opinion: VoteOpinion,
  token: string | null,
): Promise<void> {
  await apiFetch<string>(
    `/api/v1/room/vote?opinion=${opinion}&chatroom-id=${chatRoomId}`,
    { method: "POST", token },
  );
}
