// 토론철 아티클·이슈 사건 타임라인 — GET /api/v1/article, GET /api/v1/issue/events (백엔드 PR #222)
// 2026-10-19: 빈 응답(단건 404 NOT_FOUND_ARTICLE, 타임라인 items []) 은 실 curl 로 확인. 필드는 백엔드
// 세션이 확정한 실제 응답 기준 — Swagger 는 사건 스키마 이름 충돌로 틀리게 보였다(#223 에서 수정).
// 첫 게시본이 나오면 실 curl 로 다시 대조할 것.
import { apiFetch } from "./client";
import { fetchIssueMap } from "./issueMap";

// ── Types (GET /api/v1/article?article-id=) ──────

/** 아티클이 걸린 사건. 병합된 사건은 흡수한 사건으로 온다 */
export interface ArticleEvent {
  eventId: number;
  name: string;
  /** `yyyy-MM-dd`. 날짜 없이 만들어진 사건은 null */
  date: string | null;
  /** 이 사건이 걸린 노출 중 이슈 */
  issueIds: number[];
}

/**
 * 게시된 토론철판 아티클. 미게시·회수·고객사판·없는 id 는 404 NOT_FOUND_ARTICLE.
 * 출처·문단 근거는 응답에 없다(D7 미정).
 */
export interface ArticleDetail {
  /** 웹 URL 은 이 값의 소문자 base36 */
  articleId: number;
  headline: string;
  /** 평문 2~3문장. 사건 타임라인이 그대로 인용한다 */
  summary: string;
  /** 본문 문단 (평문) */
  body: string[];
  /** "토론철 AI 기자" 고정 — 사람 이름이 아니다 */
  byline: string;
  /** 항상 true */
  aiGenerated: boolean;
  articleSection: string;
  keywords: string[];
  /** 처음 게시된 시각 `yyyy-MM-dd'T'HH:mm:ss` (Asia/Seoul) */
  datePublished: string;
  /** 마지막 수정 시각. 수정이 없으면 게시 시각 */
  updatedAt: string;
  events: ArticleEvent[];
  /** 관련 이슈 — 사건 경유와 직접 연결의 합집합, 노출 중인 이슈만 */
  issueIds: number[];
}

// ── Types (GET /api/v1/issue/events) ─────────────

export interface ArticleCard {
  articleId: number;
  headline: string;
  summary: string;
  datePublished: string;
}

export interface IssueTimelineEvent {
  eventId: number;
  name: string;
  /** `yyyy-MM-dd`. null 이면 목록 뒤에 온다 */
  date: string | null;
  /** 이 사건의 게시 아티클, 최신 발행순 */
  articles: ArticleCard[];
}

export interface IssueTimelinePage {
  /** 발생일 내림차순, 날짜 없는 사건은 뒤 */
  items: IssueTimelineEvent[];
  /** 불투명 문자열. 그대로 다음 요청에 넘긴다. 마지막이면 null */
  nextCursor: string | null;
}

// ── API ──────────────────────────────────────────

/** 아티클 단건 (비로그인 200) */
export async function fetchArticle(
  articleId: number,
  token?: string | null,
): Promise<ArticleDetail> {
  return apiFetch<ArticleDetail>(`/api/v1/article?article-id=${articleId}`, { token });
}

/**
 * 이슈 사건 타임라인 한 페이지. size 기본 20, 최대 100. 잘못된 cursor 는 400,
 * ARCHIVED 이슈는 404. 병합된 사건은 빠지고 그 아티클은 흡수한 사건 밑에 온다.
 */
export async function fetchIssueTimeline(
  issueId: number,
  options?: { cursor?: string; size?: number; token?: string | null },
): Promise<IssueTimelinePage> {
  const params = new URLSearchParams();
  params.set("issue-id", String(issueId));
  if (options?.cursor) params.set("cursor", options.cursor);
  if (options?.size != null) params.set("size", String(options.size));
  return apiFetch<IssueTimelinePage>(`/api/v1/issue/events?${params.toString()}`, {
    token: options?.token,
  });
}

// ── Types (GET /api/v1/article/list) ─────────────
// 2026-10-26 실 curl 확인 (백엔드 PR #233): 비로그인 200, 게시된 토론철판만

export interface ArticleListItem extends ArticleCard {
  articleSection: string;
  /** 관련 노출 중 이슈. 없으면 [] */
  issueIds: number[];
}

export interface ArticleListPage {
  /** datePublished 내림차순, 같으면 articleId 내림차순 */
  items: ArticleListItem[];
  /** 불투명 문자열. 그대로 다음 요청에 넘긴다. 마지막이면 null */
  nextCursor: string | null;
}

/** 아티클 목록 한 페이지. size 기본 20, 최대 100. 잘못된 cursor 는 400 */
export async function fetchArticleList(options?: {
  cursor?: string;
  size?: number;
  token?: string | null;
}): Promise<ArticleListPage> {
  const params = new URLSearchParams();
  if (options?.cursor) params.set("cursor", options.cursor);
  if (options?.size != null) params.set("size", String(options.size));
  const qs = params.toString();
  return apiFetch<ArticleListPage>(`/api/v1/article/list${qs ? `?${qs}` : ""}`, {
    token: options?.token,
  });
}

// ── Types (GET /api/v1/event/recent) ─────────────
// 2026-10-26 실 curl 확인 (백엔드 PR #234): 비로그인 200, `data` 가 배열

/** 최근 등록된 사건. 목록에 나오는 이슈에 걸린 것만, 병합으로 흡수된 사건은 빠진다 */
export interface RecentEventItem {
  eventId: number;
  name: string;
  /** `yyyy-MM-dd`. 날짜 없이 만들어진 사건은 null */
  date: string | null;
  /** 발생 시각 `yyyy-MM-dd'T'HH:mm:ss` (Asia/Seoul). 없으면 null */
  occurredAt: string | null;
  /** 토론철 등록 시각 `yyyy-MM-dd'T'HH:mm:ss` (Asia/Seoul) — 정렬 기준 */
  createdAt: string;
  /** 목록에 노출 중인 이슈, 1개 이상 */
  issueIds: number[];
  /** 게시된 토론철판 최신 1건. 없으면 null */
  article: ArticleCard | null;
}

/** 최근 등록 순(createdAt 내림차순, 같으면 eventId 내림차순). size 기본 5, 최대 20 */
export async function fetchRecentEventItems(
  size: number,
  token?: string | null,
): Promise<RecentEventItem[]> {
  return apiFetch<RecentEventItem[]>(`/api/v1/event/recent?size=${size}`, { token });
}

// ── 홈 "사건 발생!" ──────────────────────────────

/** 홈 "사건 발생!" 의 사건 — 링크할 이슈 하나와 그 제목을 붙였다 */
export interface RecentEvent extends RecentEventItem {
  issueId: number;
  issueTitle: string;
}

/**
 * 최근 등록된 사건 `count` 개에 이슈 제목을 붙인다. 한 사건이 여러 이슈에 걸리면 첫 이슈로 링크한다.
 * 이슈 제목은 이슈맵 목록에서 찾고, 못 찾은 사건(목록 반영 시차 등)은 뺀다.
 */
export async function fetchRecentEvents(count: number): Promise<RecentEvent[]> {
  const [events, issues] = await Promise.all([fetchRecentEventItems(count), fetchIssueMap()]);
  const titleOf = new Map(issues.map((issue) => [issue.issueId, issue.title]));
  return events.flatMap((event) => {
    const issueId = event.issueIds[0];
    const issueTitle = issueId === undefined ? undefined : titleOf.get(issueId);
    return issueId === undefined || issueTitle === undefined
      ? []
      : [{ ...event, issueId, issueTitle }];
  });
}
