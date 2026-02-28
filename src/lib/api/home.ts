import { apiFetch } from "./client";

// ── Types ─────────────────────────────────────────

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

export interface HomeRecommendResponse {
  breakingNews: { title: string; url: string }[];
  top5BestChatRooms: BestChatRoom[];
  top5BestIssueRooms: BestIssueRoom[];
  chatRoomResponse: ChatRoomResponse[];
}

// ── API ───────────────────────────────────────────

export async function fetchHomeRecommend(
  token?: string | null,
  page?: number,
): Promise<HomeRecommendResponse> {
  const params = page != null ? `?page=${page}` : "";
  return apiFetch<HomeRecommendResponse>(`/api/v1/home/recommend${params}`, { token });
}
