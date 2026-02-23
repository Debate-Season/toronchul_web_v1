import { apiFetch } from "./client";

// ── Types ─────────────────────────────────────────
export interface IssueMapItem {
  id: string;
  title: string;
  category: string;
  countChatRoom: number;
  agree: number;
  disagree: number;
}

// ── 이슈맵 전체 목록 ─────────────────────────────
export async function fetchIssueMap(
  token?: string | null,
): Promise<IssueMapItem[]> {
  return apiFetch<IssueMapItem[]>("/api/v2/issues/map", { token });
}
