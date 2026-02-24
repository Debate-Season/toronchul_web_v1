import { apiFetch } from "./client";

// ── Types (Swagger: GET /api/v1/issue-map) ───────

export interface IssueMapItem {
  issueId: number;
  title: string;
  createdAt: string;
  countChatRoom: number;
  bookMarks: number;
}

interface IssueMapResponse {
  items: IssueMapItem[];
}

// ── 이슈맵 목록 ─────────────────────────────────────
export async function fetchIssueMap(
  token?: string | null,
  options?: { page?: string; majorcategory?: string },
): Promise<IssueMapItem[]> {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page);
  if (options?.majorcategory) params.set("majorcategory", options.majorcategory);
  const query = params.toString() ? `?${params.toString()}` : "";

  const res = await apiFetch<IssueMapResponse>(`/api/v1/issue-map${query}`, {
    token,
  });
  return res.items;
}
