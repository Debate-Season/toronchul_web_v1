"use client";

import { Children, useEffect, useMemo, useRef, useState, useCallback } from "react";
import IssueCardNew from "@/components/home/IssueCardNew";
import YoutubeLiveCard from "@/components/home/YoutubeLiveCard";
import RecommendDebateCard, {
  type DebateVote,
} from "@/components/home/RecommendDebateCard";
import BreakingNewsCard from "@/components/home/BreakingNewsCard";
import {
  fetchHome,
  fetchMedia,
  fetchBestChatRooms,
  MEDIA_CATEGORIES,
  type IssueRoom,
  type BestChatRoom,
  type MediaItem,
  type MediaResponse,
} from "@/lib/api/home";
import { fetchRoomDetail } from "@/lib/api/room";
import useAuthStore from "@/store/useAuthStore";
import { Radio, Newspaper, Lightbulb, MessagesSquare, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * 추천 토론 n개를 뽑는다 — **한 이슈당 최대 1개**.
 *
 * 원본(`top5BestChatRooms`)은 이슈 단위가 아니라 토론 단위 랭킹이라 같은 이슈의
 * 토론이 여러 개 들어온다(예: "윤석열 정부 비상계엄"의 계엄/탄핵 두 방). 그대로
 * 3개를 뽑으면 추천 목록이 한 이슈로 쏠린다.
 *
 * 셔플 후 이슈가 처음 나온 것만 담는다. 서로 다른 이슈가 n개보다 적으면 **모자란
 * 채로 반환한다** — 중복을 채워 넣지 않는다.
 */
function pickDistinctIssues(rooms: readonly BestChatRoom[], n: number): BestChatRoom[] {
  // Fisher–Yates 부분 셔플 (원본 불변).
  const shuffled = [...rooms];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const seenIssues = new Set<number>();
  const picked: BestChatRoom[] = [];
  for (const room of shuffled) {
    if (picked.length >= n) break;
    if (seenIssues.has(room.issueId)) continue;
    seenIssues.add(room.issueId);
    picked.push(room);
  }
  return picked;
}

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
// gap-3(12px). perView 지정 시 각 아이템을 width-fill 슬롯으로 감싸(한 화면 perView개),
// 버튼 클릭은 perView개씩 이동한다.
const CAROUSEL_GAP = 12;

function HorizontalCarousel({
  children,
  perView,
}: {
  children: React.ReactNode;
  /** 한 화면에 보일 개수(지정 시 각 아이템을 균등 width-fill). 미지정 시 아이템 고유 폭. */
  perView?: number;
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
    let amount: number;
    if (perView) {
      // perView개(= 슬롯 폭+gap) × perView 만큼 이동
      const first = el.firstElementChild as HTMLElement | null;
      const itemW = first ? first.offsetWidth : el.clientWidth / perView;
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
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-grey-80 text-text-primary shadow-md hover:bg-grey-70 transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
      >
        {items}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-grey-80 text-text-primary shadow-md hover:bg-grey-70 transition-colors cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

// ── 실시간 미디어 (커서 기반 무한 스크롤) ──────────────

/** 필터가 걸렸을 때 이만큼은 채우려고 다음 페이지를 자동으로 당긴다. */
const MIN_FILTERED = 5;
/** 자동으로 당길 수 있는 최대 페이지 수(1페이지 = 5건). 무한 요청 방지. */
const MAX_AUTO_PAGES = 8;

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
  /**
   * 필터를 채우려고 자동으로 더 당겨온 페이지 수. 카테고리를 바꾸면 리셋한다.
   * `MAX_AUTO_PAGES` 로 상한을 두지 않으면, 해당 카테고리 항목이 하나도 없을 때
   * 데이터가 바닥날 때까지 요청이 이어진다.
   */
  const [autoPages, setAutoPages] = useState(0);

  // initialMedia가 바뀌면 리셋
  useEffect(() => {
    setAllMedia(initialMedia);
    setHasMore(initialMedia.length > 0);
  }, [initialMedia]);

  useEffect(() => {
    setAutoPages(0);
  }, [selectedCategory]);

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

  /**
   * 칩 목록 — 고정 순서(전체 → 정치 → 경제 → 사회 → 세계)가 먼저다.
   *
   * 로드된 항목에서 뽑으면 한 페이지가 5건이라 처음엔 그 5건에 있는 카테고리만
   * 칩이 뜨고, 무한 스크롤로 뒤 페이지가 붙을 때마다 칩이 하나씩 늘어난다.
   * 서버가 새 카테고리를 만들면 그것만 알려진 목록 뒤에 덧붙인다.
   */
  const filtered = selectedCategory
    ? allMedia.filter((m) => m.category === selectedCategory)
    : allMedia;

  /**
   * 필터가 걸렸는데 보이는 항목이 부족하면 다음 페이지를 직접 당긴다.
   *
   * 서버에 카테고리 파라미터가 없어(`GET /api/v1/home/media`) 필터는 **이미
   * 불러온 항목**에만 걸린다. 한 페이지가 5건이라 필터 결과가 0건인 일이 흔한데,
   * 이때 하단 감지점은 이미 화면 안에 들어와 있어 **교차 상태가 바뀌지 않는다** —
   * IntersectionObserver 는 상태 '변화'에만 콜백하므로 다시 발화하지 않고, 목록이
   * 빈 채로 멈춘다. 그래서 옵저버와 별개로 여기서 채운다.
   */
  useEffect(() => {
    if (!selectedCategory || !hasMore || loadingRef.current) return;
    if (filtered.length >= MIN_FILTERED || autoPages >= MAX_AUTO_PAGES) return;
    setAutoPages((n) => n + 1);
    loadMore();
  }, [selectedCategory, filtered.length, hasMore, autoPages, loadMore]);

  const categories = useMemo(() => {
    const known: string[] = [...MEDIA_CATEGORIES];
    const extra = Array.from(
      new Set(allMedia.map((m) => m.category).filter((c): c is string => !!c)),
    ).filter((c) => !known.includes(c));
    return [...known, ...extra];
  }, [allMedia]);

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Newspaper size={20} className="text-brand" />
        <h2 className="text-header-20 font-bold text-text-primary">
          실시간 미디어
        </h2>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
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

      <div className="flex flex-col gap-4">
        {filtered.map((item, idx) => (
          <BreakingNewsCard key={item.mediaId ?? idx} data={item} />
        ))}
        {/* 카테고리 필터는 **이미 불러온 항목**에만 걸린다(서버에 카테고리
            파라미터가 없다). 그래서 아직 뒤 페이지가 남아 있는 동안에는
            "없습니다" 를 띄우면 안 된다 — 하단 감지점이 화면에 남아 다음
            페이지를 계속 당겨오고, 그 안에 해당 카테고리가 들어 있다. */}
        {filtered.length === 0 &&
          !loadingMore &&
          (!hasMore || autoPages >= MAX_AUTO_PAGES) && (
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
  const [mediaResponse, setMediaResponse] = useState<MediaResponse>({ youtubeLive: [], items: [] });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // "이런 토론은 어때요?" — bestChatRooms 중 이슈가 겹치지 않는 랜덤 3개
  // (데이터 로드마다 재추첨).
  const recommendedDebates = useMemo(
    () => pickDistinctIssues(bestChatRooms, 3),
    [bestChatRooms],
  );

  // 추천 토론방의 찬반 비율은 방별로 /room?chatroom-id= 에서 조회 (debateId=chatroom-id).
  const [voteByDebate, setVoteByDebate] = useState<Record<number, DebateVote>>(
    {},
  );

  useEffect(() => {
    if (recommendedDebates.length === 0) return;

    let cancelled = false;

    async function loadVotes() {
      const results = await Promise.all(
        recommendedDebates.map((room) =>
          fetchRoomDetail(room.debateId, accessToken)
            .then((d) => ({
              id: room.debateId,
              agree: d.agree,
              disagree: d.disagree,
            }))
            .catch(() => null),
        ),
      );
      if (cancelled) return;
      const map: Record<number, DebateVote> = {};
      for (const r of results) {
        if (r) map[r.id] = { agree: r.agree, disagree: r.disagree };
      }
      setVoteByDebate(map);
    }

    loadVotes();
    return () => {
      cancelled = true;
    };
  }, [recommendedDebates, accessToken]);

  useEffect(() => {
    if (!_hasHydrated) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // 토론방(bestChatRooms)은 /users/home 이 아니라 /home/recommend 에서 온다.
        const [homeData, mediaData, bestRooms] = await Promise.all([
          fetchHome(accessToken),
          fetchMedia(accessToken).catch(() => ({ youtubeLive: [], items: [] } as MediaResponse)),
          fetchBestChatRooms(accessToken).catch(() => [] as BestChatRoom[]),
        ]);

        if (!cancelled) {
          setIssueRooms(homeData.issueRooms);
          setBestChatRooms(bestRooms);
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
  if (error && issueRooms.length === 0) {
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
  const youtubeLive = mediaResponse.youtubeLive;
  const hasAnyData =
    youtubeLive.length > 0 ||
    bestChatRooms.length > 0 ||
    media.length > 0 ||
    issueRooms.length > 0;

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* ① 실시간 Live — 유튜브 라이브 (가로 스크롤) */}
      {youtubeLive.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Radio size={20} className="text-red" />
            <h2 className="text-header-20 font-bold text-text-primary">
              실시간 Live
            </h2>
          </div>
          <HorizontalCarousel perView={2}>
            {youtubeLive.map((item) => (
              <YoutubeLiveCard key={item.id} data={item} />
            ))}
          </HorizontalCarousel>
        </section>
      )}

      {/* ②-a 이런 토론은 어때요? (랜덤 3개, 가로 행 리스트) */}
      {recommendedDebates.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MessagesSquare size={20} className="text-brand" />
            <h2 className="text-header-20 font-bold text-text-primary">
              이런 토론은 어때요?
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {recommendedDebates.map((room) => (
              <RecommendDebateCard
                key={room.debateId}
                data={room}
                vote={voteByDebate[room.debateId]}
              />
            ))}
          </div>
        </section>
      )}

      {/* ②-b 새로운 이슈가 발생했어요! (최신 2개, 2열 그리드) */}
      {issueRooms.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={20} className="text-brand" />
            <h2 className="text-header-20 font-bold text-text-primary">
              새로운 이슈가 발생했어요!
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[...issueRooms]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 2)
              .map((issue) => (
                <IssueCardNew key={issue.issueId} data={issue} />
              ))}
          </div>
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
