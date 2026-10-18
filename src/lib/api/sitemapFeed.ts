// 사이트맵용 비로그인 커서 페이징 피드 — GET /api/v1/sitemap/issues, GET /api/v1/sitemap/threads
// 2026-10-19 실 curl(`GET /api/v1/sitemap/{issues,threads}`, 백엔드 PR #217)로 확인
import { apiFetch } from "./client";

// ── Types ────────────────────────────────────────

export interface SitemapIssueItem {
  issueId: number;
  /**
   * max(이슈 생성/수정, 노출 중인 토론 주제 추가 시각, 위키 게시 시각).
   * `yyyy-MM-dd'T'HH:mm:ss` (Asia/Seoul, 오프셋 없음)
   */
  updatedAt: string;
}

export interface SitemapThreadItem {
  threadId: number;
  /**
   * 마지막 채팅 시각, 채팅이 없으면 생성 시각.
   * `yyyy-MM-dd'T'HH:mm:ss` (Asia/Seoul, 오프셋 없음)
   */
  lastActivityAt: string;
}

/** 커서 페이지. nextCursor 가 null 이면 마지막 페이지 */
export interface SitemapPage<T> {
  items: T[];
  nextCursor: number | null;
}

export type SitemapIssuesPage = SitemapPage<SitemapIssueItem>;
export type SitemapThreadsPage = SitemapPage<SitemapThreadItem>;

// ── API ──────────────────────────────────────────

/** 서버 최대 size (기본 1000, 최대 5000). id 오름차순, 잘못된 cursor 는 400 */
const MAX_PAGE_SIZE = 5000;

function buildQuery(cursor?: number, size?: number): string {
  const params = new URLSearchParams();
  if (cursor != null) params.set("cursor", String(cursor));
  if (size != null) params.set("size", String(size));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** 이슈 피드 한 페이지 */
export async function fetchSitemapIssuesPage(
  cursor?: number,
  size?: number,
): Promise<SitemapIssuesPage> {
  return apiFetch<SitemapIssuesPage>(
    `/api/v1/sitemap/issues${buildQuery(cursor, size)}`,
  );
}

/** 토론 주제 피드 한 페이지 */
export async function fetchSitemapThreadsPage(
  cursor?: number,
  size?: number,
): Promise<SitemapThreadsPage> {
  return apiFetch<SitemapThreadsPage>(
    `/api/v1/sitemap/threads${buildQuery(cursor, size)}`,
  );
}

/** 이슈 피드 전체 (size 5000 으로 nextCursor 가 null 일 때까지) */
export async function fetchAllSitemapIssues(): Promise<SitemapIssueItem[]> {
  return collectAll(fetchSitemapIssuesPage);
}

/** 토론 주제 피드 전체 (size 5000 으로 nextCursor 가 null 일 때까지) */
export async function fetchAllSitemapThreads(): Promise<SitemapThreadItem[]> {
  return collectAll(fetchSitemapThreadsPage);
}

// ── Helpers ──────────────────────────────────────

/**
 * 페이지를 끝까지 모은다. 커서가 앞으로 나아가지 않으면(응답 이상) 무한 루프를
 * 막기 위해 거기서 멈추고 지금까지 모은 것만 돌려준다.
 */
async function collectAll<T>(
  fetchPage: (cursor?: number, size?: number) => Promise<SitemapPage<T>>,
): Promise<T[]> {
  const all: T[] = [];
  let cursor: number | undefined;

  for (;;) {
    const page = await fetchPage(cursor, MAX_PAGE_SIZE);
    all.push(...page.items);

    const next = page.nextCursor;
    if (next === null || next === undefined) break;
    if (cursor !== undefined && next <= cursor) break;
    cursor = next;
  }

  return all;
}
