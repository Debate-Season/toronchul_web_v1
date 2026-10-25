"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Newspaper } from "lucide-react";
import BreakingNewsCard from "@/components/media/BreakingNewsCard";
import { fetchMedia, MEDIA_CATEGORIES, type MediaItem } from "@/lib/api/home";
import useAuthStore from "@/store/useAuthStore";

// ── 실시간 미디어 (커서 기반 무한 스크롤) ──────────────
// 홈에서 뉴스(`/news`)로 옮겨 왔다. 첫 페이지도 여기서 직접 받는다 — 홈은 같은 응답의
// `youtubeLive` 만 쓴다.

/** 필터가 걸렸을 때 이만큼은 채우려고 다음 페이지를 자동으로 당긴다. */
const MIN_FILTERED = 5;
/** 자동으로 당길 수 있는 최대 페이지 수(1페이지 = 5건). 무한 요청 방지. */
const MAX_AUTO_PAGES = 8;

/** 첫 페이지를 받아 피드를 그린다. 비었거나 실패하면 섹션을 통째로 숨긴다(홈과 같은 동작) */
export default function MediaSection() {
  const { accessToken, _hasHydrated } = useAuthStore();
  const [initialMedia, setInitialMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!_hasHydrated) return;
    let cancelled = false;
    fetchMedia(accessToken)
      .then((res) => {
        if (!cancelled) setInitialMedia(res.items);
      })
      .catch(() => {
        if (!cancelled) setInitialMedia([]);
      });
    return () => {
      cancelled = true;
    };
  }, [_hasHydrated, accessToken]);

  if (initialMedia.length === 0) return null;
  return <MediaFeed initialMedia={initialMedia} token={accessToken} />;
}

function MediaFeed({
  initialMedia,
  token,
}: {
  initialMedia: MediaItem[];
  token: string | null;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
          onClick={() => setSelectedCategory(null)}
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
              setSelectedCategory(selectedCategory === cat ? null : cat)
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
