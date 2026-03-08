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
  type MediaResponse,
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

// ── 실시간 미디어 (커서 기반 무한 스크롤) ──────────────

function MediaSection({
  initialMedia,
  selectedCategory,
  onCategoryChange,
  token,
}: {
  initialMedia: MediaItem[];
  selectedCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  token: string | null;
}) {
  const [allMedia, setAllMedia] = useState<MediaItem[]>(initialMedia);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMedia.length > 0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // initialMedia가 바뀌면 리셋
  useEffect(() => {
    setAllMedia(initialMedia);
    setHasMore(initialMedia.length > 0);
  }, [initialMedia]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoadingMore(true);

    try {
      const lastItem = allMedia[allMedia.length - 1];
      const cursor = lastItem?.outdated;
      if (!cursor) {
        setHasMore(false);
        return;
      }

      const res = await fetchMedia(token, cursor);
      const newItems = res.items.filter(
        (item) => !allMedia.some((m) => m.mediaId === item.mediaId),
      );

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setAllMedia((prev) => [...prev, ...newItems]);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [allMedia, hasMore, token]);

  // IntersectionObserver로 하단 감지 → API 추가 호출
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const categories = Array.from(
    new Set(
      allMedia.map((m) => m.category).filter((c): c is string => !!c),
    ),
  );
  const filtered = selectedCategory
    ? allMedia.filter((m) => m.category === selectedCategory)
    : allMedia;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Newspaper size={20} className="text-brand" />
        <h2 className="text-header-20 font-bold text-text-primary">
          실시간 미디어
        </h2>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-grey">
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-body-14 font-medium transition-colors cursor-pointer ${
              selectedCategory === null
                ? "bg-brand text-white"
                : "bg-grey-90 text-text-secondary hover:bg-grey-80"
            }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() =>
                onCategoryChange(selectedCategory === cat ? null : cat)
              }
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-body-14 font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-brand text-white"
                  : "bg-grey-90 text-text-secondary hover:bg-grey-80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {filtered.map((item, idx) => (
          <BreakingNewsCard key={item.mediaId ?? idx} data={item} />
        ))}
        {filtered.length === 0 && !loadingMore && (
          <p className="text-body-14 text-text-secondary text-center py-4">
            해당 카테고리의 미디어가 없습니다.
          </p>
        )}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 rounded-full border-2 border-grey-80 border-t-brand animate-spin" />
          </div>
        )}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </section>
  );
}

// ── Page ──────────────────────────────────────────
export default function Home() {
  const { accessToken, _hasHydrated } = useAuthStore();

  const [issueRooms, setIssueRooms] = useState<IssueRoom[]>([]);
  const [bestChatRooms, setBestChatRooms] = useState<BestChatRoom[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoomResponse[]>([]);
  const [mediaResponse, setMediaResponse] = useState<MediaResponse>({ youtubeLive: [], items: [] });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
          fetchMedia(accessToken).catch(() => ({ youtubeLive: [], items: [] } as MediaResponse)),
        ]);

        if (!cancelled) {
          setIssueRooms(homeData.issueRooms);
          setBestChatRooms(homeData.bestChatRooms);
          setChatRooms(homeData.chatRooms);
          setMediaResponse(mediaData);
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

  const media = mediaResponse.items;
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
        <MediaSection
          initialMedia={media}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          token={accessToken}
        />
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
