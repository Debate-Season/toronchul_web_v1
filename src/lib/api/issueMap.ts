import { apiFetch } from "./client";

// ── Types ────────────────────────────────────────

export interface IssueMapItem {
  issueId: number;
  title: string;
  createdAt: string;
  countChatRoom: number;
  bookMarks: number;
}

// ── 이슈맵 목록 ─────────────────────────────────────
/**
 * Swagger: GET /api/v1/users/home (이슈방 전체 목록)
 */
export async function fetchIssueMap(
  token?: string | null,
  options?: { page?: string; majorcategory?: string },
): Promise<IssueMapItem[]> {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page);
  if (options?.majorcategory) params.set("majorcategory", options.majorcategory);
  const query = params.toString() ? `?${params.toString()}` : "";

  const raw = await apiFetch<unknown>(`/api/v1/users/home${query}`, { token });

  // data가 배열이면 그대로 사용
  if (Array.isArray(raw)) return raw;

  // data가 객체면 내부에서 이슈 배열 추출
  const obj = raw as Record<string, unknown>;
  const items = obj.items ?? obj.issueRooms ?? obj.issues ?? obj.top5BestIssueRooms;
  return Array.isArray(items) ? items : [];
}
