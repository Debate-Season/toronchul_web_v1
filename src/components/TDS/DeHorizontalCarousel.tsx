"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── 가로 스크롤 캐러셀 ──────────────────────────────
// gap-3(12px). perView 지정 시 각 아이템을 width-fill 슬롯으로 감싸(한 화면 perView개),
// 버튼 클릭은 perView개씩 이동한다. 홈 "실시간 Live" 와 뉴스 "토론철 기사" 가 같이 쓴다.
const CAROUSEL_GAP = 12;

interface DeHorizontalCarouselProps {
  children: React.ReactNode;
  /** 한 화면에 보일 개수(지정 시 각 아이템을 균등 width-fill). 미지정 시 아이템 고유 폭. */
  perView?: number;
}

export default function DeHorizontalCarousel({ children, perView }: DeHorizontalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    let amount: number;
    if (perView) {
      // perView개(= 슬롯 폭+gap) × perView 만큼 이동
      const first = el.firstElementChild;
      const itemW = first instanceof HTMLElement ? first.offsetWidth : el.clientWidth / perView;
      amount = (itemW + CAROUSEL_GAP) * perView;
    } else {
      amount = el.clientWidth * 0.7;
    }
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  // perView 지정 시 각 아이템을 균등 폭 슬롯으로 래핑.
  // (홀수 마지막 항목도 슬롯 폭이 고정이라 반 칸 폭 + 나머지 공백으로 렌더)
  const items = perView
    ? Children.map(children, (child) => (
        <div
          className="min-w-0"
          style={{
            flex: `0 0 calc((100% - ${(perView - 1) * CAROUSEL_GAP}px) / ${perView})`,
          }}
        >
          {child}
        </div>
      ))
    : children;

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          aria-label="이전"
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-grey-80 text-text-primary shadow-md hover:bg-grey-70 transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scroll-smooth">
        {items}
      </div>

      {canScrollRight && (
        <button
          type="button"
          aria-label="다음"
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-grey-80 text-text-primary shadow-md hover:bg-grey-70 transition-colors cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
