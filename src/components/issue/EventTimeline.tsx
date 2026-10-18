import Link from "next/link";
import { articleHref, eventAnchorId } from "@/lib/routes";
import { formatWikiDate } from "@/lib/wikiText";

/** 타임라인이 그리는 사건 — `GET /api/v1/issue/events` 의 항목과 같은 모양 */
export interface TimelineEventView {
  eventId: number;
  name: string;
  /** `yyyy-MM-dd`. 날짜 없는 사건은 null — 백엔드가 목록 뒤에 둔다 */
  date: string | null;
  /** 이 사건의 게시 아티클, 최신 발행순 */
  articles: { articleId: number; headline: string; summary: string }[];
}

/**
 * 이슈 페이지의 사건 타임라인 (PRD v1.1.0 §3). **서버 컴포넌트** — 크롤러가 읽는 "최신성" 본문이다.
 *
 * - 사건 설명은 **가장 최근 아티클의 요약을 인용**한다. 원문은 아티클 페이지 한 곳에 있고 여기는
 *   발췌 + 링크다 — 인용임을 화면에 보이게(따옴표·"토론철 아티클") 해서 중복이 아니라 인용으로 읽힌다
 * - 사건마다 `id="event-{b36}"` 앵커 — 아티클 페이지의 "관련 사건" 이 이리로 돌아온다
 * - 사건이 없으면 섹션을 그리지 않는다(빈 안내 반복 금지)
 */
export default function EventTimeline({ events }: { events: TimelineEventView[] }) {
  if (events.length === 0) return null;

  return (
    <section aria-labelledby="timeline-heading">
      <h2
        id="timeline-heading"
        className="mb-3 text-body-16 font-semibold text-text-primary"
      >
        사건 타임라인
      </h2>
      <ol className="flex flex-col gap-3">
        {events.map((event) => {
          const [lead, ...rest] = event.articles;
          return (
            <li
              key={event.eventId}
              id={eventAnchorId(event.eventId)}
              className="scroll-mt-20 rounded-2xl border border-border bg-surface-elevated p-4"
            >
              <article className="flex flex-col gap-2">
                <header className="flex flex-col gap-0.5">
                  {event.date && (
                    <time
                      dateTime={event.date}
                      className="text-caption-12 text-text-secondary"
                    >
                      {formatWikiDate(event.date)}
                    </time>
                  )}
                  <h3 className="text-body-16 font-semibold text-text-primary">
                    {event.name}
                  </h3>
                </header>

                {lead && (
                  <blockquote
                    cite={articleHref(lead.articleId)}
                    className="border-l-2 border-border pl-3 text-body-14 text-text-secondary"
                  >
                    <p>“{lead.summary}”</p>
                    <footer className="mt-1 text-caption-12">
                      토론철 아티클 ·{" "}
                      <Link
                        href={articleHref(lead.articleId)}
                        className="text-brand underline underline-offset-2"
                      >
                        {lead.headline}
                      </Link>
                    </footer>
                  </blockquote>
                )}

                {rest.length > 0 && (
                  <ul className="flex flex-col gap-1 text-body-14">
                    {rest.map((a) => (
                      <li key={a.articleId}>
                        <Link
                          href={articleHref(a.articleId)}
                          className="text-text-primary underline underline-offset-2"
                        >
                          {a.headline}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
