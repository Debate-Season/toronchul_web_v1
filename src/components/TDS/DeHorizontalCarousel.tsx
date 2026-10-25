"use client";

import { Children, useEffect, useLayoutEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── 가로 무한 캐러셀 ──────────────────────────────
// 홈 "실시간 Live" 와 뉴스 "토론철 기사" 가 같이 쓴다. 한 화면에 perView 칸, 버튼은 perView 칸씩 옮긴다.
//
// 무한 이동: 끝에 앞쪽 perView 칸의 복제본을 붙인다. 마지막 화면에서 → 를 누르면 복제본까지
// 부드럽게 넘어간 뒤, 스크롤이 멈추면 같은 그림인 진짜 첫 화면으로 애니메이션 없이 옮긴다.
// 첫 화면에서 ← 는 반대로 복제본 자리로 먼저 옮긴 뒤 마지막 화면으로 부드럽게 간다. 복제본을
// 앞이 아니라 뒤에만 두는 건, 서버 HTML(스크롤 0)이 그대로 진짜 첫 화면이 되게 하려고다.
// 손가락 스와이프도 네이티브 스크롤이라 같은 정리 로직을 탄다.
const CAROUSEL_GAP = 12;
/** 마지막 scroll 이벤트 뒤 이만큼 조용하면 멈춘 것으로 본다(scrollend 미지원 브라우저 포함) */
const SETTLE_MS = 120;

interface DeHorizontalCarouselProps {
  children: React.ReactNode;
  /** 한 화면에 보일 칸 수. 각 칸은 균등 폭이다 */
  perView: number;
  /**
   * 지정하면 보던 위치(칸 번호)를 sessionStorage 에 이 키로 적어 두고, 다시 마운트될 때 그 화면에서
   * 시작한다 — 상세로 갔다가 뒤로가기로 돌아와도 보던 목록이 유지된다.
   */
  persistKey?: string;
}

function readIndex(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(key);
    const n = raw === null ? NaN : Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

function writeIndex(key: string, index: number) {
  try {
    sessionStorage.setItem(key, String(index));
  } catch {
    // 저장소가 막힌 환경에서는 매번 처음부터 보인다
  }
}

export default function DeHorizontalCarousel({
  children,
  perView,
  persistKey,
}: DeHorizontalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);
  const count = items.length;
  /** 한 화면에 다 들어가면 버튼도 복제본도 없다 */
  const loops = count > perView;
  /** 진짜 칸의 마지막 화면 시작 칸 — 끝을 넘지 않게 맞춘다 */
  const lastStart = count - perView;

  const slotStyle = {
    flex: `0 0 calc((100% - ${(perView - 1) * CAROUSEL_GAP}px) / ${perView})`,
  };

  /** 칸 하나 + 간격 (px) */
  const stride = () => {
    const first = scrollRef.current?.firstElementChild;
    return first instanceof HTMLElement ? first.offsetWidth + CAROUSEL_GAP : 0;
  };

  // 저장된 화면에서 시작 — 그리기 전에 옮겨 깜빡임을 없앤다
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !persistKey || !loops) return;
    const saved = readIndex(persistKey);
    if (saved === null) return;
    el.scrollTo({ left: Math.min(saved, lastStart) * stride(), behavior: "instant" });
  }, [persistKey, loops, lastStart]);

  // 멈추면: 복제본 위에 있으면 같은 그림의 진짜 칸으로 옮기고, 위치를 저장한다
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !loops) return;
    let timer = 0;
    const settle = () => {
      const s = stride();
      if (s === 0) return;
      const wrapAt = count * s;
      if (el.scrollLeft >= wrapAt - 1) {
        el.scrollTo({ left: el.scrollLeft - wrapAt, behavior: "instant" });
      }
      if (persistKey) writeIndex(persistKey, Math.round(el.scrollLeft / s));
    };
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, SETTLE_MS);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
    };
  }, [loops, count, persistKey]);

  const move = (dir: "left" | "right") => {
    const el = scrollRef.current;
    const s = stride();
    if (!el || s === 0) return;
    const at = Math.round(el.scrollLeft / s);

    let target: number;
    if (dir === "right") {
      // 마지막 화면이면 뒤의 복제본(= 첫 화면)으로 넘어간다
      target = at >= lastStart ? count : Math.min(at + perView, lastStart);
    } else if (at <= 0) {
      // 첫 화면이면 같은 그림인 복제본 자리로 먼저 옮긴 뒤 마지막 화면으로 넘어간다
      el.scrollTo({ left: count * s, behavior: "instant" });
      target = lastStart;
    } else {
      target = Math.max(at - perView, 0);
    }
    el.scrollTo({ left: target * s, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {loops && (
        <button
          type="button"
          aria-label="이전"
          onClick={() => move("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-grey-80 text-text-primary shadow-md hover:bg-grey-70 transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2">
        {items.map((child, i) => (
          <div key={`item-${i}`} className="min-w-0" style={slotStyle}>
            {child}
          </div>
        ))}
        {/* 무한 이동용 복제본 — 보조기기·탭 이동에서는 빠진다 */}
        {loops &&
          items.slice(0, perView).map((child, i) => (
            <div key={`clone-${i}`} className="min-w-0" style={slotStyle} aria-hidden inert>
              {child}
            </div>
          ))}
      </div>

      {loops && (
        <button
          type="button"
          aria-label="다음"
          onClick={() => move("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-grey-80 text-text-primary shadow-md hover:bg-grey-70 transition-colors cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
