// 이슈 토론위키 조회 — GET /api/v2/wiki
// 2026-10-19 실 curl(`GET /api/v2/wiki?issue-id=8`)·Swagger `WikiResponse` 로 확인
import { apiFetch } from "./client";
import { toBackendDateTime } from "./dateTime";

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
  /**
   * 본문 요약 — 2~3문장 평문(Markdown 없음), 150자 안팎. 미게시이거나 요약이 없으면 null
   * (2026-10-19 Swagger·실 curl 확인). ADMIN 수동 리비전은 비어 있을 수 있다
   */
  summary: string | null;
  /** `yyyy-MM-dd'T'HH:mm:ss` (Asia/Seoul, 오프셋 없음). 미게시면 null — 받을 때 정규화한다(아래) */
  updatedAt: string | null;
}

/**
 * 실제 응답의 `updatedAt`. Swagger 는 `date-time` 문자열이라고 하지만 2026-10-19 운영은
 * `[2026,10,19,3,48,27,937427000]` 같은 **배열**로 내려왔다(Jackson 기본 직렬화). 배열을
 * 문자열로 믿고 쓰면 날짜 포맷에서 예외가 나 페이지가 500 이 된다 — 그래서 `unknown` 으로
 * 받아 좁힌다. 백엔드가 문자열로 고쳐도 그대로 동작한다.
 */
interface RawWikiResponse extends Omit<WikiResponse, "updatedAt"> {
  updatedAt: unknown;
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

  const raw = await apiFetch<RawWikiResponse>(`/api/v2/wiki?${params.toString()}`, {
    token,
  });
  return { ...raw, updatedAt: toBackendDateTime(raw.updatedAt) };
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
