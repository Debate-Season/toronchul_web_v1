import { apiFetch } from "./client";

// ── Types (Swagger: GET /api/v1/home/refresh) ────

export interface BreakingNews {
  title: string;
  url: string;
}

export interface BestChatRoom {
  issueId: number;
  issueTitle: string;
  debateId: number;
  debateTitle: string;
  time: string;
}

export interface BestIssueRoom {
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
  opinion: string;
  time: string;
}

export interface HomeRefreshData {
  breakingNews: BreakingNews[];
  top5BestChatRooms: BestChatRoom[];
  top5BestIssueRooms: BestIssueRoom[];
  chatRoomResponse: ChatRoomResponse[];
}

// ── 홈 화면 데이터 ──────────────────────────────────
export async function fetchHomeRefresh(
  token?: string | null,
  page?: number,
): Promise<HomeRefreshData> {
  const params = page != null ? `?page=${page}` : "";
  return apiFetch<HomeRefreshData>(`/api/v1/home/refresh${params}`, { token });
}
