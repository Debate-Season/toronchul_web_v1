// 토론철 아티클·이슈 사건 타임라인 — GET /api/v1/article, GET /api/v1/issue/events (백엔드 PR #222)
// 2026-10-19: 빈 응답(단건 404 NOT_FOUND_ARTICLE, 타임라인 items []) 은 실 curl 로 확인. 필드는 백엔드
// 세션이 확정한 실제 응답 기준 — Swagger 는 사건 스키마 이름 충돌로 틀리게 보였다(#223 에서 수정).
// 첫 게시본이 나오면 실 curl 로 다시 대조할 것.
import { apiFetch } from "./client";
import { fetchAllSitemapArticles } from "./sitemapFeed";

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

// ── 뉴스 목록 (임시 조합) ─────────────────────────

/**
 * 게시된 토론철 아티클 전체, 발행 최신순. 비로그인 목록 API 가 아직 없어서(`/api/v1/articles` 는
 * 401) 사이트맵 피드의 id 로 단건을 병렬 조회해 만든다 — 2026-10-26 기준 23건. 서버에서만 부르고
 * 각 요청은 `apiFetch` 의 서버 익명 캐시(60초)를 탄다. 목록 API 가 생기면 그걸로 갈아끼울 것.
 * 단건이 실패(회수 직후 404 등)하면 그 항목만 뺀다.
 */
export async function fetchArticleList(): Promise<ArticleCard[]> {
  const feed = await fetchAllSitemapArticles();
  const results = await Promise.allSettled(feed.map((item) => fetchArticle(item.articleId)));
  return results
    .flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
    .map(({ articleId, headline, summary, datePublished }) => ({
      articleId,
      headline,
      summary,
      datePublished,
    }))
    .sort((a, b) => (a.datePublished < b.datePublished ? 1 : -1));
}
