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
  category?: string;
  outdated?: string;
}

export interface YoutubeLiveItem {
  id: number;
  title: string;
  supplier: string;
  videoId: string;
  category: string;
  createAt: string;
  src: string;
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
  const path = `/api/v1/users/home${params}`;

  let raw: unknown;
  try {
    raw = await apiFetch<unknown>(path, { token });
  } catch (err) {
    // 백엔드가 토큰 실은 요청에만 500을 뱉는 케이스(유저 조인/개인화 조회 실패) 방어:
    // 익명 호출은 정상 응답하므로 한 번만 폴백한다. 개인화 필드(bookMarks 등)는 빠질 수 있음.
    const msg = err instanceof Error ? err.message : "";
    if (token && /\b5\d{2}\b/.test(msg)) {
      raw = await apiFetch<unknown>(path, {});
    } else {
      throw err;
    }
  }

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
export interface MediaResponse {
  youtubeLive: YoutubeLiveItem[];
  items: MediaItem[];
}

export async function fetchMedia(
  token?: string | null,
  time?: string,
): Promise<MediaResponse> {
  const params = time ? `?time=${encodeURIComponent(time)}` : "";
  const raw = await apiFetch<unknown>(`/api/v1/home/media${params}`, { token });

  const obj = raw as Record<string, unknown>;

  // youtubeLiveContainer는 객체 형태 → 배열로 변환
  const liveContainer = obj.youtubeLiveContainer as
    | Record<string, YoutubeLiveItem>
    | undefined;
  const youtubeLive: YoutubeLiveItem[] = liveContainer
    ? Object.values(liveContainer)
    : [];

  // items 배열 — 필드명 매핑 (src → thumbnailUrl, supplier → source)
  const rawItems = toArray<Record<string, unknown>>(obj.items);
  const items: MediaItem[] = rawItems.map((item) => ({
    mediaId: item.id as number | undefined,
    title: item.title as string,
    url: item.url as string,
    type: item.type as string | undefined,
    thumbnailUrl: (item.src ?? item.thumbnailUrl) as string | undefined,
    source: (item.supplier ?? item.source) as string | undefined,
    category: item.category as string | undefined,
    outdated: item.outdated as string | undefined,
  }));

  return { youtubeLive, items };
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
