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

/** 카드 폭·간격(px). 축 선분 길이와 스크롤 위치 계산이 같은 값을 쓴다 */
const CARD_WIDTH = 156;
const CARD_GAP = 16;
/** 축 점의 중심 x — 점은 카드 왼쪽 안쪽에 둔다(음수 좌표면 스크롤 영역 경계에서 잘린다) */
const DOT_CENTER = 4;

/**
 * 강조 기준점. 스크롤 진행도에 따라 왼쪽 끝 → 가운데 → 오른쪽 끝으로 옮겨 간다.
 * 양 끝에 빈 여백을 두지 않으므로(사용자 결정) 첫·마지막 카드는 가운데까지 오지 못한다 —
 * 기준점을 같이 옮겨야 끝까지 밀었을 때 첫·마지막 사건이 강조된다.
 */
function anchorX(scroller: HTMLElement): number {
  const max = scroller.scrollWidth - scroller.clientWidth;
  const progress = max > 0 ? scroller.scrollLeft / max : 1;
  return scroller.scrollLeft + progress * scroller.clientWidth;
}

/**
 * 카드가 강조되도록 하는 scrollLeft — anchorX(s) = s·(1 + w/max) 를 카드 중심에 맞춘 해.
 * 끝 쪽 카드는 그 해에서 일부가 화면 밖으로 잘리므로, 카드 전체가 보이는 범위로 한 번 더 좁힌다.
 */
function scrollLeftFor(scroller: HTMLElement, card: HTMLElement): number {
  const max = scroller.scrollWidth - scroller.clientWidth;
  if (max <= 0) return 0;
  const center = card.offsetLeft + card.clientWidth / 2;
  const ideal = center / (1 + scroller.clientWidth / max);
  const fullyVisible = Math.min(
    card.offsetLeft,
    Math.max(ideal, card.offsetLeft + card.clientWidth - scroller.clientWidth),
  );
  return Math.min(max, Math.max(0, fullyVisible));
}

/**
 * 이슈 페이지의 사건 타임라인 (PRD v1.1.0 §3, Figma `홈` 5525:48147 참고).
 *
 * 왼쪽이 과거, 오른쪽이 최신인 **가로 스크롤**이다. 탭이 아니다 — 스크롤 위치의 기준점에
 * 온 사건 카드만 강조된다. 처음에는 최신 사건(또는 주소의 `#event-…`)이 강조되고, 카드를
 * 누르면 그 사건으로 스크롤된다. 타임라인 위에서 세로 휠을 굴리면 Shift 없이 좌우로 움직이고,
 * 양 끝에 닿으면 페이지 스크롤로 넘어간다. 양 끝에 여백 없이 첫·마지막 카드에서 멈춘다.
 * 카드에는 날짜·사건명과 관련 아티클(제목 · 토론철 · N일 전)만 두고, 사건 설명·본문·썸네일은
 * 두지 않는다(2026-10-19 사용자 결정).
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

    // 처음 위치 — 주소의 사건, 없으면 최신 사건
    const hashIndex = cards.findIndex((c) => `#${c.id}` === window.location.hash);
    scroller.scrollLeft = scrollLeftFor(scroller, cards[hashIndex >= 0 ? hashIndex : cards.length - 1]);

    let frame = 0;
    const update = () => {
      frame = 0;
      const anchor = anchorX(scroller);
      let nearest = 0;
      let best = Infinity;
      cards.forEach((card, i) => {
        const distance = Math.abs(card.offsetLeft + card.clientWidth / 2 - anchor);
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

    // 세로 휠 → 가로 스크롤. 더 갈 곳이 없는 끝에서는 막지 않아 페이지가 내려간다
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // 트랙패드 가로 제스처는 그대로
      const max = scroller.scrollWidth - scroller.clientWidth;
      if (max <= 0) return;
      const atStart = scroller.scrollLeft <= 0;
      const atEnd = scroller.scrollLeft >= max - 1;
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
      e.preventDefault();
      scroller.scrollLeft += e.deltaY;
    };

    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    // preventDefault 를 쓰므로 passive 가 아니어야 한다
    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("wheel", onWheel);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /** 카드를 누르면 그 사건으로 스크롤한다. 안의 아티클 링크는 그대로 이동한다 */
  const focusCard = (index: number, card: HTMLElement) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setActive(index);
    scroller.scrollTo({ left: scrollLeftFor(scroller, card), behavior: "smooth" });
  };

  if (ordered.length === 0) return null;

  return (
    <section aria-labelledby="timeline-heading" className="flex flex-col gap-3">
      <h2 id="timeline-heading" className="text-header-18 font-semibold text-text-primary">
        사건 타임라인
      </h2>

      <ol
        ref={scrollerRef}
        // relative — 카드의 offsetLeft 가 이 스크롤 컨테이너 기준이 되게(아니면 페이지 기준이라 사이드바 폭만큼 어긋난다)
        className="scrollbar-none relative flex gap-4 overflow-x-auto pb-2"
      >
        {ordered.map((event, i) => {
          const on = i === active;
          const last = i === ordered.length - 1;
          return (
            <li
              key={event.eventId}
              id={eventAnchorId(event.eventId)}
              data-event-card
              aria-current={on ? "true" : undefined}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a")) return;
                focusCard(i, e.currentTarget);
              }}
              className="relative flex shrink-0 cursor-pointer scroll-mt-20 flex-col gap-3"
              style={{ width: CARD_WIDTH }}
            >
              {/* 축 — 점에서 다음 사건의 점까지 선을 긋는다. 강조된 사건은 점이 밝고 눈금이 길다 */}
              <div className="relative h-7" aria-hidden="true">
                {!last && (
                  <div
                    className="absolute top-[3.5px] h-px bg-border"
                    style={{ left: DOT_CENTER, width: CARD_WIDTH + CARD_GAP }}
                  />
                )}
                <div
                  className={`absolute top-[3.5px] w-px ${on ? "h-6 bg-grey-10" : "h-4 bg-grey-50"}`}
                  style={{ left: DOT_CENTER - 0.5 }}
                />
                <div
                  className={`absolute top-0 size-2 rounded-full ${on ? "bg-grey-10" : "bg-grey-50"}`}
                  style={{ left: DOT_CENTER - 4 }}
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
                  {/* 키보드로도 사건을 고를 수 있게 제목을 버튼으로 둔다 */}
                  <button
                    type="button"
                    className="text-left"
                    onClick={(e) => {
                      e.stopPropagation();
                      const card = e.currentTarget.closest<HTMLElement>("[data-event-card]");
                      if (card) focusCard(i, card);
                    }}
                  >
                    {event.name}
                  </button>
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
      </ol>
    </section>
  );
}
