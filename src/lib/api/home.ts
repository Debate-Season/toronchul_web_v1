import { apiFetch } from "./client";

// ── Types ─────────────────────────────────────────

export interface IssueRoom {
  issueId: number;
  title: string;
  createdAt: string;
  countChatRoom: number;
  bookMarks: number;
}

export interface ChatRoomResponse {
  chatRoomId: number;
  title: string;
  content: string;
  agree: number;
  disagree: number;
  createdAt: string;
  opinion: "AGREE" | "DISAGREE";
  time: string;
}

export interface BestChatRoom {
  issueId: number;
  issueTitle: string;
  debateId: number;
  debateTitle: string;
  time: string;
}

export interface MediaItem {
  mediaId?: number;
  title: string;
  url: string;
  type?: string;
  thumbnailUrl?: string;
  source?: string;
}

/** /api/v1/users/home 응답 — 구조가 배열 또는 객체일 수 있음 */
export interface HomeResponse {
  issueRooms: IssueRoom[];
  chatRooms: ChatRoomResponse[];
  bestChatRooms: BestChatRoom[];
}

// ── API ───────────────────────────────────────────

/**
 * 홈 화면 데이터 (이슈방 전체 목록)
 * Swagger: GET /api/v1/users/home
 */
export async function fetchHome(
  token?: string | null,
  page?: number,
): Promise<HomeResponse> {
  const params = page != null ? `?page=${page}` : "";
  const raw = await apiFetch<unknown>(`/api/v1/users/home${params}`, { token });

  // 응답 형태에 따라 유연하게 파싱
  if (Array.isArray(raw)) {
    // data가 배열이면 이슈방 목록으로 취급
    return { issueRooms: raw, chatRooms: [], bestChatRooms: [] };
  }

  const obj = raw as Record<string, unknown>;

  return {
    issueRooms: toArray(
      obj.issueRooms ?? obj.issues ?? obj.top5BestIssueRooms ?? obj.items,
    ),
    chatRooms: toArray(obj.chatRooms ?? obj.chatRoomResponse),
    bestChatRooms: toArray(obj.bestChatRooms ?? obj.top5BestChatRooms),
  };
}

/**
 * 미디어 목록
 * Swagger: GET /api/v1/home/media
 */
export async function fetchMedia(
  token?: string | null,
): Promise<MediaItem[]> {
  const raw = await apiFetch<unknown>(`/api/v1/home/media`, { token });

  if (Array.isArray(raw)) return raw;

  const obj = raw as Record<string, unknown>;
  return toArray(obj.items ?? obj.media ?? obj.mediaList);
}

/**
 * 인기 토론방 목록 (사이드바용)
 * Swagger: GET /api/v1/home/recommend → top5BestChatRooms
 */
export async function fetchBestChatRooms(
  token?: string | null,
): Promise<BestChatRoom[]> {
  const raw = await apiFetch<Record<string, unknown>>(`/api/v1/home/recommend`, { token });
  return toArray(raw.top5BestChatRooms ?? raw.bestChatRooms);
}

// ── Helpers ───────────────────────────────────────

function toArray<T = unknown>(val: unknown): T[] {
  if (Array.isArray(val)) return val;
  return [];
}
