import Link from "next/link";
import { formatWikiDate } from "@/lib/wikiText";

/** 아티클 화면이 그리는 값 — `GET /api/v1/article` 응답에서 페이지가 골라 넘긴다 */
export interface ArticleViewProps {
  headline: string;
  summary: string;
  /** 본문 문단 (평문). Markdown 이 아니라 렌더러 없이 `<p>` 로 그린다 */
  body: string[];
  byline: string;
  datePublished: string;
  updatedAt: string;
  /** 관련 사건 — "{이슈 제목} · {사건명}" 으로 이슈 페이지의 사건 앵커에 링크한다 */
  related: { key: string; label: string; href: string }[];
}

/**
 * 토론철 아티클 본문 (PRD v1.1.0 §2.2). **서버 컴포넌트.**
 *
 * - 상단 AI 생성 라벨은 필수다(AI기본법 제31조, 발행 게이트). 숨기지 않는다
 * - "← 이슈" 뒤로가기를 두지 않는다 — 아티클은 이슈 아래가 아니고 여러 이슈에 걸칠 수 있다.
 *   관계는 하단 "관련 사건" 이 맡는다
 * - 출처 블록은 D7(법률 검토) 결정 전까지 그리지 않는다
 */
export default function ArticleView({
  headline,
  summary,
  body,
  byline,
  datePublished,
  updatedAt,
  related,
}: ArticleViewProps) {
  const edited = updatedAt.slice(0, 10) !== datePublished.slice(0, 10);

  return (
    <article className="flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-3">
        <p className="w-fit rounded-full border border-border px-2.5 py-0.5 text-caption-12 text-text-secondary">
          {byline} · AI 생성 기사
        </p>
        <h1 className="text-header-20 font-bold text-text-primary">{headline}</h1>
        <p className="text-caption-12 text-text-secondary">
          <time dateTime={datePublished}>{formatWikiDate(datePublished)}</time> 발행
          {edited && (
            <>
              {" · "}
              <time dateTime={updatedAt}>{formatWikiDate(updatedAt)}</time> 수정
            </>
          )}
        </p>
      </header>

      <p className="rounded-2xl border border-border bg-surface-elevated p-4 text-body-14 leading-relaxed text-text-primary">
        {summary}
      </p>

      <div className="flex flex-col gap-4 text-body-16 leading-relaxed text-text-primary">
        {body.map((paragraph, i) => (
          // 문단은 순서가 곧 정체성이고 재정렬되지 않아 인덱스 키로 충분하다
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="flex flex-col gap-2">
          <h2
            id="related-heading"
            className="text-body-16 font-semibold text-text-primary"
          >
            관련 사건
          </h2>
          <ul className="flex flex-col gap-1 text-body-14">
            {related.map((r) => (
              <li key={r.key}>
                <Link
                  href={r.href}
                  className="text-brand underline underline-offset-2"
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
