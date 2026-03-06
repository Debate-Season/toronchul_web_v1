"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import IssueCard from "@/components/home/IssueCard";
import IssueCardNew from "@/components/home/IssueCardNew";
import LiveDebateCard from "@/components/home/LiveDebateCard";
import BreakingNewsCard from "@/components/home/BreakingNewsCard";
import {
  fetchHome,
  fetchMedia,
  type IssueRoom,
  type BestChatRoom,
  type ChatRoomResponse,
  type MediaItem,
} from "@/lib/api/home";
import useAuthStore from "@/store/useAuthStore";
import { Radio, Newspaper, Flame, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";

// ── Skeleton ─────────────────────────────────────
function SkeletonShell() {
  return (
    <div className="flex flex-col gap-8 py-4">
      <section>
        <div className="h-6 w-40 rounded bg-grey-90 animate-pulse mb-4" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 h-32 rounded-2xl bg-grey-90 animate-pulse"
            />
          ))}
        </div>
      </section>
      <section>
        <div className="h-6 w-40 rounded bg-grey-90 animate-pulse mb-4" />
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-grey-90 animate-pulse"
            />
          ))}
        </div>
      </section>
      <section>
        <div className="h-6 w-48 rounded bg-grey-90 animate-pulse mb-4" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-grey-90 animate-pulse"
            />
          ))}
        </div>
      </section>
      <section>
        <div className="h-6 w-44 rounded bg-grey-90 animate-pulse mb-4" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-56 h-28 rounded-2xl bg-grey-90 animate-pulse"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ── 가로 스크롤 캐러셀 ──────────────────────────────
function HorizontalCarousel({
  children,
}: {
  children: React.ReactNode;
}) {
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
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-grey-80 text-text-primary shadow-md hover:bg-grey-70 transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-grey scroll-smooth"
      >
        {children}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-grey-80 text-text-primary shadow-md hover:bg-grey-70 transition-colors cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────
export default function Home() {
  const { accessToken, _hasHydrated } = useAuthStore();

  const [issueRooms, setIssueRooms] = useState<IssueRoom[]>([]);
  const [bestChatRooms, setBestChatRooms] = useState<BestChatRoom[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoomResponse[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!_hasHydrated) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [homeData, mediaData] = await Promise.all([
          fetchHome(accessToken),
          fetchMedia(accessToken).catch(() => [] as MediaItem[]),
        ]);

        if (!cancelled) {
          setIssueRooms(homeData.issueRooms);
          setBestChatRooms(homeData.bestChatRooms);
          setChatRooms(homeData.chatRooms);
          setMedia(mediaData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "피드를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [_hasHydrated, accessToken, retryKey]);

  // ── Hydration 대기 / Loading ──
  if (!_hasHydrated || loading) {
    return <SkeletonShell />;
  }

  // ── Error (데이터 없을 때) ──
  if (error && issueRooms.length === 0 && chatRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-body-16 text-red">{error}</p>
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="rounded-lg border border-border px-4 py-2 text-body-14 text-text-secondary transition-colors hover:bg-grey-90 cursor-pointer"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const hasAnyData =
    bestChatRooms.length > 0 ||
    media.length > 0 ||
    chatRooms.length > 0 ||
    issueRooms.length > 0;

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* ① 실시간 Live (가로 스크롤) */}
      {bestChatRooms.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Radio size={20} className="text-red" />
            <h2 className="text-header-20 font-bold text-text-primary">
              실시간 Live
            </h2>
          </div>
          <HorizontalCarousel>
            {bestChatRooms.map((room) => (
              <LiveDebateCard key={room.debateId} data={room} />
            ))}
          </HorizontalCarousel>
        </section>
      )}

      {/* ② 이런 이슈는 어때요? (가로 스크롤) */}
      {issueRooms.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={20} className="text-brand" />
            <h2 className="text-header-20 font-bold text-text-primary">
              이런 이슈는 어때요?
            </h2>
          </div>
          <HorizontalCarousel>
            {issueRooms.map((issue) => (
              <IssueCardNew key={issue.issueId} data={issue} />
            ))}
          </HorizontalCarousel>
        </section>
      )}

      {/* ③ 실시간 미디어 */}
      {media.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Newspaper size={20} className="text-brand" />
            <h2 className="text-header-20 font-bold text-text-primary">
              실시간 미디어
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {media.map((item, idx) => (
              <BreakingNewsCard key={item.mediaId ?? idx} data={item} />
            ))}
          </div>
        </section>
      )}

      {/* ④ 뜨겁게 논쟁 중인 찬반토론 (세로 리스트) */}
      {chatRooms.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Flame size={20} className="text-red" />
            <h2 className="text-header-20 font-bold text-text-primary">
              뜨겁게 논쟁 중인 찬반토론
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {chatRooms.map((room) => (
              <IssueCard key={room.chatRoomId} data={room} />
            ))}
          </div>
        </section>
      )}

      {/* 데이터가 하나도 없을 때 */}
      {!hasAnyData && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-body-16 text-text-secondary">
            아직 등록된 토론이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
