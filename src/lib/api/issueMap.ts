import { apiFetch } from "./client";

// ── Types ────────────────────────────────────────

export interface IssueMapItem {
  issueId: number;
  title: string;
  createdAt: string;
  countChatRoom: number;
  /**
   * 북마크 기능이 아직 없어서 `/api/v1/users/home` 은 이 값을 **채우지 않는다**
   * (실측 17건 전부 null). 화면에 그리면 빈 자리가 되므로 쓰지 말 것.
   * 기능이 생겨 서버가 숫자를 내려주기 시작하면 그때 `number` 로 좁힌다.
   */
  bookMarks: number | null;
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
