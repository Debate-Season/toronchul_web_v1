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
