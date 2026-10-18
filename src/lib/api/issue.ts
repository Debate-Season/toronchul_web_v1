import { apiFetch } from "./client";

// ── Types (GET /api/v1/issue) ────────────────────

/**
 * 이슈 생명주기 (백엔드 `IssueStatus`). DORMANT 는 노출을 유지한 채 분류만 다르다.
 * DRAFT·ARCHIVED 는 미노출이라 색인·sitemap 에서 뺀다.
 */
export type IssueStatus = "DRAFT" | "PUBLISHED" | "DORMANT" | "ARCHIVED";

/** 검색에 노출하는 상태 */
export function isIndexableIssueStatus(status: IssueStatus): boolean {
  return status === "PUBLISHED" || status === "DORMANT";
}

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
  status: IssueStatus;
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
