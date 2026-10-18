"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { articleHref, eventAnchorId } from "@/lib/routes";

/** 타임라인이 그리는 사건 — `GET /api/v1/issue/events` 의 항목과 같은 모양 */
export interface TimelineEventView {
  eventId: number;
  name: string;
  /** `yyyy-MM-dd`. 날짜 없는 사건은 null — 백엔드가 목록 뒤에 둔다 */
  date: string | null;
  /** 이 사건의 게시 아티클, 최신 발행순 */
  articles: { articleId: number; headline: string; datePublished: string }[];
}

/** `yyyy-MM-dd` → `yy.M.d` (시안 표기, 예: 25.7.12) */
function shortDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${y.slice(2)}.${Number(m)}.${Number(d)}`;
}

/** 백엔드 시각(Asia/Seoul) → "N일 전". 하루 안이면 "오늘" */
function daysAgo(dateTime: string): string {
  const published = new Date(`${dateTime}+09:00`).getTime();
  const days = Math.floor((Date.now() - published) / 86_400_000);
  return days <= 0 ? "오늘" : `${days}일 전`;
}

/**
 * 이슈 페이지의 사건 타임라인 (PRD v1.1.0 §3, Figma `홈` 5525:48147 참고).
 *
 * 왼쪽이 과거, 오른쪽이 최신인 **가로 스크롤**이다. 탭이 아니다 — 고른다는 개념 없이,
 * 스크롤해서 **가운데에 온 사건 카드만 강조**된다. 처음에는 최신 사건(또는 주소의
 * `#event-…`)이 가운데로 온다. 카드에는 날짜·사건명과 관련 아티클(제목 · 토론철 · N일 전)이
 * 있고, 사건 설명·본문·썸네일은 두지 않는다(2026-10-19 사용자 결정).
 *
 * 강조는 스크롤 위치에 따라 바뀌므로 클라이언트 컴포넌트지만, 서버 HTML 에 모든 사건과
 * 아티클 링크가 그대로 들어간다 — 크롤러가 읽는 내부 링크다. 사건이 없으면 그리지 않는다.
 */
export default function EventTimeline({ events }: { events: TimelineEventView[] }) {
  // API 는 최신순 → 화면은 왼쪽이 과거
  const ordered = [...events].reverse();

  const scrollerRef = useRef<HTMLOListElement | null>(null);
  const [active, setActive] = useState(ordered.length - 1);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cards = Array.from(scroller.querySelectorAll<HTMLElement>("[data-event-card]"));
    if (cards.length === 0) return;

    // 처음 위치 — 주소의 사건, 없으면 최신 사건을 가운데로
    const hashIndex = cards.findIndex((c) => `#${c.id}` === window.location.hash);
    const start = cards[hashIndex >= 0 ? hashIndex : cards.length - 1];
    scroller.scrollLeft = start.offsetLeft - (scroller.clientWidth - start.clientWidth) / 2;

    let frame = 0;
    const update = () => {
      frame = 0;
      const center = scroller.scrollLeft + scroller.clientWidth / 2;
      let nearest = 0;
      let best = Infinity;
      cards.forEach((card, i) => {
        const distance = Math.abs(card.offsetLeft + card.clientWidth / 2 - center);
        if (distance < best) {
          best = distance;
          nearest = i;
        }
      });
      setActive(nearest);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  if (ordered.length === 0) return null;

  return (
    <section aria-labelledby="timeline-heading" className="flex flex-col gap-3">
      <h2 id="timeline-heading" className="text-header-18 font-semibold text-text-primary">
        사건 타임라인
      </h2>

      <ol
        ref={scrollerRef}
        // relative — 카드의 offsetLeft 가 이 스크롤 컨테이너 기준이 되게(아니면 페이지 기준이라 사이드바 폭만큼 어긋난다)
        className="scrollbar-none relative -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
      >
        {/*
          양 끝 카드도 가운데까지 올 수 있게 반 화면만큼 빈 칸을 둔다. 가로 스크롤 flex 컨테이너의
          오른쪽 padding 은 스크롤 영역에 들어가지 않아(브라우저 동작) padding 대신 요소로 둔다
        */}
        <li aria-hidden="true" className="w-[calc(50%-94px)] shrink-0" />
        {ordered.map((event, i) => {
          const on = i === active;
          return (
            <li
              key={event.eventId}
              id={eventAnchorId(event.eventId)}
              data-event-card
              aria-current={on ? "true" : undefined}
              className="relative flex w-[156px] shrink-0 snap-center scroll-mt-20 flex-col gap-3"
            >
              {/* 축 — 카드를 가로지르는 선 위의 점. 강조된 사건은 점이 밝고 눈금이 길다 */}
              <div className="relative h-6" aria-hidden="true">
                <div className="absolute inset-x-[-8px] top-0 h-px bg-border" />
                <div
                  className={`absolute left-0 top-0 w-px ${on ? "h-6 bg-grey-10" : "h-4 bg-grey-50"}`}
                />
                <div
                  className={`absolute -left-[3.5px] -top-[3.5px] size-2 rounded-full ${
                    on ? "bg-grey-10" : "bg-grey-50"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                {event.date && (
                  <time
                    dateTime={event.date}
                    className={`text-caption-12-tight ${on ? "text-text-primary" : "text-text-secondary"}`}
                  >
                    {shortDate(event.date)}
                  </time>
                )}
                <h3
                  className={`line-clamp-2 text-header-18 font-semibold ${
                    on ? "text-text-primary" : "text-text-secondary"
                  }`}
                >
                  {event.name}
                </h3>
              </div>

              {event.articles.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {event.articles.map((a) => (
                    <li key={a.articleId}>
                      <Link href={articleHref(a.articleId)} className="flex flex-col gap-0.5">
                        <span className="line-clamp-2 text-body-16 font-medium text-text-primary">
                          {a.headline}
                        </span>
                        <span className="text-caption-12 text-text-secondary">
                          토론철 ·{" "}
                          {/* 상대 시각은 서버와 브라우저의 "지금" 이 달라 어긋날 수 있다 */}
                          <time dateTime={a.datePublished} suppressHydrationWarning>
                            {daysAgo(a.datePublished)}
                          </time>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
        <li aria-hidden="true" className="w-[calc(50%-94px)] shrink-0" />
      </ol>
    </section>
  );
}
