import { apiFetch } from "./client";

// ── Types (GET /api/v1/issue) ────────────────────

export interface ChatRoomInIssue {
  chatRoomId: number;
  title: string;
  content: string;
  agree: number;
  disagree: number;
  createdAt: string;
  opinion: string;
  time: string;
}

export interface IssueDetailResponse {
  title: string;
  bookMarkState: string;
  bookMarks: number;
  chats: number;
  map: Record<string, number>;
  chatRoomMap: ChatRoomInIssue[];
}

// ── API ──────────────────────────────────────────

export async function fetchIssueDetail(
  issueId: number,
  token?: string | null,
  page?: number,
): Promise<IssueDetailResponse> {
  const params = new URLSearchParams();
  params.set("issue-id", String(issueId));
  if (page != null) params.set("page", String(page));

  return apiFetch<IssueDetailResponse>(`/api/v1/issue?${params.toString()}`, {
    token,
  });
}
