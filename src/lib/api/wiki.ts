// 이슈 토론위키 조회 — GET /api/v2/wiki
// 2026-10-19 실 curl(`GET /api/v2/wiki?issue-id=8`)·Swagger `WikiResponse` 로 확인
import { apiFetch } from "./client";

// ── Types (GET /api/v2/wiki) ─────────────────────

/**
 * 토론위키 응답 (Swagger `WikiResponse`).
 * 게시본이 없으면 status·content·model·revisionId·updatedAt 이 모두 null 로 온다.
 * 없는 이슈는 404 NOT_FOUND_ISSUE (`ApiError.status === 404`).
 */
export interface WikiResponse {
  issueId: number;
  issueTitle: string;
  /** 게시 상태. 게시본이 없으면 null (예: "PUBLISHED") */
  status: string | null;
  /** Markdown 본문. 미게시면 null */
  content: string | null;
  /** AI 생성일 때만 모델명, 아니면 null */
  model: string | null;
  /** 미게시면 null */
  revisionId: number | null;
  /** `yyyy-MM-dd'T'HH:mm:ss` (Asia/Seoul, 오프셋 없음). 미게시면 null */
  updatedAt: string | null;
}

/** 게시된 위키 — status "PUBLISHED" 이고 본문이 있는 경우만 */
export interface PublishedWiki extends WikiResponse {
  status: "PUBLISHED";
  content: string;
  revisionId: number;
  updatedAt: string;
}

// ── API ──────────────────────────────────────────

/** 이슈의 토론위키 조회 (로그인 선택, 비로그인 200) */
export async function fetchIssueWiki(
  issueId: number,
  token?: string | null,
): Promise<WikiResponse> {
  const params = new URLSearchParams();
  params.set("issue-id", String(issueId));

  return apiFetch<WikiResponse>(`/api/v2/wiki?${params.toString()}`, {
    token,
  });
}

// ── Helpers ──────────────────────────────────────

/** status "PUBLISHED" 이고 content 가 null 이 아니어야 게시본으로 본다 */
export function isPublishedWiki(w: WikiResponse): w is PublishedWiki {
  return (
    w.status === "PUBLISHED" &&
    w.content !== null &&
    w.revisionId !== null &&
    w.updatedAt !== null
  );
}
