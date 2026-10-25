import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { fetchArticleList, type ArticleCard } from "@/lib/api/article";
import { articleHref } from "@/lib/routes";
import { ARTICLE_INDEXABLE, buildMetadata } from "@/lib/seo";
import { formatWikiDate } from "@/lib/wikiText";
import DeHorizontalCarousel from "@/components/TDS/DeHorizontalCarousel";
import MediaSection from "@/components/media/MediaSection";

/** 서버 익명 조회 캐시(`apiFetch`, 60초)와 같은 값 */
export const revalidate = 60;

/** 한 칸에 쌓는 기사 수 × 칸 수 = 최근 15건 */
const ARTICLES_PER_PAGE = 5;
const ARTICLE_PAGES = 3;

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

/**
 * 뉴스 — `/news`. 위는 토론철 기사(최근 15건을 5건씩 3칸, 홈 "실시간 Live" 처럼 좌우 버튼),
 * 아래는 홈에서 옮겨 온 실시간 미디어.
 */
export default async function NewsPage() {
  // 목록을 못 받으면(429 등) 빈 섹션으로 그리고 다음 재생성(60초)에 다시 받는다 — 빌드·ISR 이
  // 예외로 멈추지 않게
  const articles = (await fetchArticleList().catch(() => [])).slice(
    0,
    ARTICLES_PER_PAGE * ARTICLE_PAGES,
  );
  const pages: ArticleCard[][] = [];
  for (let i = 0; i < articles.length; i += ARTICLES_PER_PAGE) {
    pages.push(articles.slice(i, i + ARTICLES_PER_PAGE));
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* 화면 제목은 두지 않는다(LNB 가 이미 '뉴스'). 문서 개요용 h1 만 남긴다 */}
      <h1 className="sr-only">뉴스</h1>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-brand" />
          <h2 className="text-header-20 font-bold text-text-primary">토론철 기사</h2>
        </div>

        {pages.length > 0 ? (
          <DeHorizontalCarousel perView={1} persistKey="news:articlePage">
            {pages.map((page) => (
              <ul key={page[0].articleId} className="flex flex-col gap-3">
                {page.map((article) => (
                  <li key={article.articleId}>
                    <ArticleListCard article={article} />
                  </li>
                ))}
              </ul>
            ))}
          </DeHorizontalCarousel>
        ) : (
          <p className="py-10 text-center text-body-14 text-text-secondary">
            아직 게시된 기사가 없습니다.
          </p>
        )}
      </section>

      <MediaSection />
    </div>
  );
}

function ArticleListCard({ article }: { article: ArticleCard }) {
  return (
    <Link href={articleHref(article.articleId)} className="block">
      <article className="flex flex-col gap-1.5 rounded-2xl border border-border bg-surface-elevated p-4 transition-colors hover:border-grey-70">
        <h3 className="text-body-16 font-semibold text-text-primary line-clamp-2">
          {article.headline}
        </h3>
        <p className="text-body-14 text-text-secondary line-clamp-1">{article.summary}</p>
        <time dateTime={article.datePublished} className="text-caption-12 text-text-secondary">
          {formatWikiDate(article.datePublished)}
        </time>
      </article>
    </Link>
  );
}
