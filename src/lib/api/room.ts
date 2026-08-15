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

// ── Types (GET /api/v2/room) ─────────────────────
// 이슈 진입 시 컨테이너 방 1개 + 스레드 목록을 한 번에 조회. optional auth
// (비로그인 200, 로그인 시 myOpinion 채워짐). threadId 는 기존 채팅방 id 그대로라
// 투표/상세 등 v1 room 계열 API 에 그대로 넘길 수 있다(스레드 = 옛 방).

/** 스레드 단위 내 투표. 비로그인/미투표는 NEUTRAL. */
export type ThreadOpinion = VoteOpinion | "NEUTRAL";

/** GET /api/v2/room 의 스레드(= 기존 채팅방) */
export interface RoomThread {
  threadId: number;
  title: string;
  agreeCount: number;
  disagreeCount: number;
  myOpinion: ThreadOpinion;
}

export interface IssueRoomResponse {
  /**
   * 모바일이 구독/입장하고 STOMP 도 이 id 로 구독하는 컨테이너 방 id
   * (`/topic/room{containerRoomId}`). 방이 하나도 없는 예외 케이스면 null.
   */
  containerRoomId: number | null;
  issueId: number;
  issueTitle: string;
  /** chat_room_id 내림차순(최신순) 정렬 */
  threads: RoomThread[];
}

/**
 * GET /api/v2/room — 이슈의 컨테이너 방 + 스레드 목록. optional auth.
 * 존재하지 않는 issue-id → 404 (code: NOT_FOUND_ISSUE).
 */
export async function fetchIssueRoom(
  issueId: number,
  token?: string | null,
): Promise<IssueRoomResponse> {
  return apiFetch<IssueRoomResponse>(
    `/api/v2/room?issue-id=${issueId}`,
    { token },
  );
}

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
