import type { Metadata } from "next";
import Link from "next/link";
import { fetchArticleList } from "@/lib/api/article";
import { articleHref } from "@/lib/routes";
import { ARTICLE_INDEXABLE, buildMetadata } from "@/lib/seo";
import { formatWikiDate } from "@/lib/wikiText";

/** 서버 익명 조회 캐시(`apiFetch`, 60초)와 같은 값 */
export const revalidate = 60;

/**
 * 아티클 페이지와 같은 색인 게이트를 따른다 — 목록만 색인되면 noindex 인 기사로 가는 링크 모음이 된다.
 * 게이트가 열리면 정적 sitemap 에도 올릴 것.
 */
export const metadata: Metadata = buildMetadata({
  title: "뉴스",
  description: "토론철 AI 기자가 정리한 이슈별 최신 기사",
  path: "/news",
  indexable: ARTICLE_INDEXABLE,
});

/** 토론철 아티클 목록 — `/news`. 발행 최신순, 카드를 누르면 `/article/{b36}` 로 간다 */
export default async function NewsPage() {
  const articles = await fetchArticleList();

  return (
    <div className="flex flex-col gap-6 py-4">
      <h1 className="text-header-20 font-bold text-text-primary">뉴스</h1>

      {articles.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {articles.map((article) => (
            <li key={article.articleId}>
              <Link href={articleHref(article.articleId)} className="block">
                <article className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-elevated p-4 transition-colors hover:border-grey-70">
                  <h2 className="text-body-16 font-semibold text-text-primary line-clamp-2">
                    {article.headline}
                  </h2>
                  <p className="text-body-14 text-text-secondary line-clamp-2">
                    {article.summary}
                  </p>
                  <time
                    dateTime={article.datePublished}
                    className="text-caption-12 text-text-secondary"
                  >
                    {formatWikiDate(article.datePublished)}
                  </time>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-body-16 text-text-secondary">아직 게시된 기사가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
