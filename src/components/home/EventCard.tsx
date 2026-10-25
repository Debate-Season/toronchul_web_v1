import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { RecentEvent } from "@/lib/api/article";
import { issueEventHref } from "@/lib/routes";
import { formatWikiDate } from "@/lib/wikiText";

/**
 * 홈 "사건 발생!" 카드. 누르면 이슈 페이지의 그 사건 자리(타임라인 앵커)로 간다.
 * 사건에 게시 기사가 있으면 최신 기사의 요약을 두 줄까지 보인다.
 */
export default function EventCard({ data }: { data: RecentEvent }) {
  const article = data.articles[0];

  return (
    <Link href={issueEventHref(data.issueId, data.eventId)} className="block">
      <article className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-elevated p-4 transition-colors hover:border-grey-70">
        <p className="text-caption-12 text-text-secondary">
          {data.issueTitle}
          {data.date && (
            <>
              {" · "}
              <time dateTime={data.date}>{formatWikiDate(data.date)}</time>
            </>
          )}
        </p>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-body-16 font-semibold text-text-primary line-clamp-2">{data.name}</h3>
          <ChevronRight size={16} className="shrink-0 text-text-secondary" />
        </div>
        {article && (
          <p className="text-body-14 text-text-secondary line-clamp-2">{article.summary}</p>
        )}
      </article>
    </Link>
  );
}
