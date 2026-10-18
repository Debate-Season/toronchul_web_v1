import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { fetchArticle, type ArticleDetail } from "@/lib/api/article";
import { fetchIssueMap } from "@/lib/api/issueMap";
import { articleHref, issueEventHref, issueHref, parseEntityId } from "@/lib/routes";
import {
  ARTICLE_INDEXABLE,
  SITE_NAME,
  articleJsonLd,
  breadcrumbJsonLd,
  buildMetadata,
  toDescription,
} from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import ArticleView from "@/components/article/ArticleView";

type Params = { params: Promise<{ id: string }> };

/** AI 생성 고지 — 화면 라벨과 JSON-LD `creditText` 가 같은 사실을 말한다 */
const ARTICLE_CREDIT_TEXT = "토론철 AI 기자가 작성한 AI 생성 기사입니다";

/**
 * 경로 판정 + 아티클 조회. `generateMetadata` 와 페이지가 같은 요청 안에서 한 번만 부른다.
 * 게시된 토론철판만 200 이고 나머지는 백엔드가 404 를 준다. SSR 호출은 토큰 없이 한다.
 */
const loadArticle = cache(async (segment: string): Promise<ArticleDetail> => {
  const parsed = parseEntityId(segment);
  if (!parsed) notFound();
  if (parsed.segment !== segment) permanentRedirect(articleHref(parsed.id));

  return fetchArticle(parsed.id).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const article = await loadArticle(id);
  return buildMetadata({
    title: article.headline,
    description: toDescription(article.summary),
    path: articleHref(article.articleId),
    type: "article",
    indexable: ARTICLE_INDEXABLE,
  });
}

/**
 * 토론철 아티클 — `/article/{b36}` (PRD v1.1.0 §2). 이슈·사건에 종속되지 않는 독립 페이지다.
 * 관련 사건은 "{이슈 제목} · {사건명}" 으로 이슈 페이지의 사건 앵커에 링크한다.
 * 색인 게이트가 닫혀 있는 동안 `noindex, follow`(`ARTICLE_INDEXABLE`).
 */
export default async function ArticlePage({ params }: Params) {
  const { id } = await params;
  const article = await loadArticle(id);
  // 이슈 제목은 목록에서 찾는다. 실패하면 사건명만으로 링크를 만든다
  const issues = await fetchIssueMap().catch(() => []);
  const titleOf = new Map(issues.map((issue) => [issue.issueId, issue.title]));

  const related = article.events.flatMap((event) =>
    event.issueIds.map((issueId) => ({
      key: `${event.eventId}:${issueId}`,
      label: titleOf.has(issueId) ? `${titleOf.get(issueId)} · ${event.name}` : event.name,
      href: issueEventHref(issueId, event.eventId),
    })),
  );
  const path = articleHref(article.articleId);

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          path,
          headline: article.headline,
          description: toDescription(article.summary),
          datePublished: article.datePublished,
          dateModified: article.updatedAt,
          section: article.articleSection,
          keywords: article.keywords,
          creditText: ARTICLE_CREDIT_TEXT,
          aboutIssuePaths: article.issueIds.map(issueHref),
        })}
      />
      {/* 아티클은 이슈 아래가 아니므로 홈 › 제목 */}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: SITE_NAME, path: "/" },
          { name: article.headline, path },
        ])}
      />
      <ArticleView
        headline={article.headline}
        summary={article.summary}
        body={article.body}
        byline={article.byline}
        datePublished={article.datePublished}
        updatedAt={article.updatedAt}
        related={related}
      />
    </>
  );
}
