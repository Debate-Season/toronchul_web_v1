// 토론철 아티클·이슈 사건 타임라인 — GET /api/v1/article, GET /api/v1/issue/events (백엔드 PR #222)
// 2026-10-19: 빈 응답(단건 404 NOT_FOUND_ARTICLE, 타임라인 items []) 은 실 curl 로 확인. 필드는 백엔드
// 세션이 확정한 실제 응답 기준 — Swagger 는 사건 스키마 이름 충돌로 틀리게 보였다(#223 에서 수정).
// 첫 게시본이 나오면 실 curl 로 다시 대조할 것.
import { apiFetch } from "./client";
import { fetchIssueMap } from "./issueMap";
import { isIndexableIssueStatus } from "./issue";

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

// ── 임시 조합 공통 ───────────────────────────────

/**
 * 단건을 여러 개 부를 때 동시에 띄우는 최대 수. 한꺼번에 수십 개를 쏘면 백엔드가
 * 429 RATE_LIMIT_EXCEEDED 를 준다(2026-10-26 빌드 프리렌더에서 실측).
 */
const FAN_OUT_CONCURRENCY = 4;

/** `Promise.allSettled` 와 같은 결과를, 동시에 `FAN_OUT_CONCURRENCY` 개씩만 돌려 얻는다 */
async function settleWithLimit<T, R>(
  inputs: readonly T[],
  run: (input: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(inputs.length);
  let next = 0;
  async function worker() {
    while (next < inputs.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await run(inputs[i]) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(FAN_OUT_CONCURRENCY, inputs.length) }, worker),
  );
  return results;
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

// ── 최근 사건 (임시 조합) ─────────────────────────

/** 홈 "사건 발생!" 의 사건 — 타임라인 사건에 그 사건이 걸린 이슈를 붙였다 */
export interface RecentEvent extends IssueTimelineEvent {
  issueId: number;
  issueTitle: string;
}

/**
 * 최근 생성된 사건 `count` 개. 비로그인 최근 사건 API 가 아직 없어서 노출 중인 이슈마다 타임라인을
 * 받아 모은다(2026-10-26 기준 이슈 33개·사건 9개). 응답에 생성 시각이 없어 **eventId 내림차순을
 * 생성 순으로 본다**(자동 증가). 한 사건이 여러 이슈에 걸리면 먼저 만난 이슈 하나로 링크한다.
 * 서버에서만 부르고 각 요청은 `apiFetch` 의 서버 익명 캐시(60초)를 탄다. 실패한 이슈는 건너뛴다.
 */
export async function fetchRecentEvents(count: number): Promise<RecentEvent[]> {
  const issues = (await fetchIssueMap()).filter((issue) => isIndexableIssueStatus(issue.status));
  const timelines = await settleWithLimit(issues, (issue) =>
    fetchIssueTimeline(issue.issueId, { size: 100 }),
  );

  const byId = new Map<number, RecentEvent>();
  timelines.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    for (const event of result.value.items) {
      if (byId.has(event.eventId)) continue;
      byId.set(event.eventId, { ...event, issueId: issues[i].issueId, issueTitle: issues[i].title });
    }
  });
  return [...byId.values()].sort((a, b) => b.eventId - a.eventId).slice(0, count);
}
