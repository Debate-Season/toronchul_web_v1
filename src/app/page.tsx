"use client";

import { useEffect, useState } from "react";
import IssueCard from "@/components/home/IssueCard";
import IssueCardNew from "@/components/home/IssueCardNew";
import LiveDebateCard from "@/components/home/LiveDebateCard";
import BreakingNewsCard from "@/components/home/BreakingNewsCard";
import {
  fetchHomeRecommend,
  type BestIssueRoom,
  type BestChatRoom,
  type ChatRoomResponse,
} from "@/lib/api/home";
import useAuthStore from "@/store/useAuthStore";
import { Radio, Newspaper, Flame, Lightbulb } from "lucide-react";

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

// ── Page ──────────────────────────────────────────
export default function Home() {
  const { accessToken, _hasHydrated } = useAuthStore();

  const [bestIssues, setBestIssues] = useState<BestIssueRoom[]>([]);
  const [bestChatRooms, setBestChatRooms] = useState<BestChatRoom[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoomResponse[]>([]);
  const [breakingNews, setBreakingNews] = useState<
    { title: string; url: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!_hasHydrated) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        // Optional Auth: token이 없어도 API 호출 가능
        const data = await fetchHomeRecommend(accessToken);
        if (!cancelled) {
          setBestIssues(data.top5BestIssueRooms);
          setBestChatRooms(data.top5BestChatRooms);
          setChatRooms(data.chatRoomResponse);
          setBreakingNews(data.breakingNews);
          setHasMore(data.chatRoomResponse.length >= 3);
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

  async function loadMore() {
    if (loadingMore || !hasMore || chatRooms.length === 0) return;
    setLoadingMore(true);
    try {
      const cursor = chatRooms[chatRooms.length - 1].chatRoomId;
      const data = await fetchHomeRecommend(accessToken, cursor);
      setChatRooms((prev) => [...prev, ...data.chatRoomResponse]);
      setHasMore(data.chatRoomResponse.length >= 3);
    } catch {
      setError("추가 피드를 불러오지 못했습니다.");
    } finally {
      setLoadingMore(false);
    }
  }

  // ── Hydration 대기 / Loading ──
  if (!_hasHydrated || loading) {
    return <SkeletonShell />;
  }

  // ── Error (데이터 없을 때) ──
  if (error && chatRooms.length === 0) {
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
    breakingNews.length > 0 ||
    chatRooms.length > 0 ||
    bestIssues.length > 0;

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
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {bestChatRooms.map((room) => (
              <LiveDebateCard key={room.debateId} data={room} />
            ))}
          </div>
        </section>
      )}

      {/* ② 실시간 미디어 */}
      {breakingNews.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Newspaper size={20} className="text-brand" />
            <h2 className="text-header-20 font-bold text-text-primary">
              실시간 미디어
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {breakingNews.map((news, idx) => (
              <BreakingNewsCard key={idx} data={news} />
            ))}
          </div>
        </section>
      )}

      {/* ③ 뜨겁게 논쟁 중인 찬반토론 (세로 리스트) */}
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

          {/* 더보기 */}
          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-4 w-full py-3 rounded-xl border border-border text-body-14 font-medium text-text-secondary hover:bg-surface-elevated transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loadingMore ? "불러오는 중..." : "더보기"}
            </button>
          )}
          {error && (
            <p className="mt-2 text-center text-caption-12 text-red">
              {error}
            </p>
          )}
        </section>
      )}

      {/* ④ 이런 이슈는 어때요? (가로 스크롤) */}
      {bestIssues.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={20} className="text-brand" />
            <h2 className="text-header-20 font-bold text-text-primary">
              이런 이슈는 어때요?
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {bestIssues.map((issue) => (
              <IssueCardNew key={issue.issueId} data={issue} />
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
