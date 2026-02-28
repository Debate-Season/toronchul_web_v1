"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import IssueCard from "@/components/home/IssueCard";
import IssueCardNew from "@/components/home/IssueCardNew";
import {
  fetchHomeRecommend,
  type BestIssueRoom,
  type ChatRoomResponse,
  type HomeRecommendResponse,
} from "@/lib/api/home";
import useAuthStore from "@/store/useAuthStore";

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
              className="flex-shrink-0 w-56 h-28 rounded-2xl bg-grey-90 animate-pulse"
            />
          ))}
        </div>
      </section>
      <section>
        <div className="h-6 w-40 rounded bg-grey-90 animate-pulse mb-4" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-grey-90 animate-pulse"
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
  const [chatRooms, setChatRooms] = useState<ChatRoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!accessToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchHomeRecommend(accessToken);
        if (!cancelled) {
          setBestIssues(data.top5BestIssueRooms);
          setChatRooms(data.chatRoomResponse);
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

  // ── 비로그인: 로그인 유도 ──
  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-header-20 font-bold text-text-primary">
          토론철에 오신 것을 환영합니다
        </p>
        <p className="text-body-14 text-text-secondary text-center">
          로그인하면 실시간 토론과 핫한 이슈를 확인할 수 있습니다.
        </p>
        <Link
          href="/login"
          className="mt-2 rounded-lg bg-brand px-6 py-2.5 text-body-14 font-semibold text-white transition-colors hover:opacity-90"
        >
          로그인하기
        </Link>
      </div>
    );
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

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* 핫한 토론 주제 (가로 스크롤) */}
      {bestIssues.length > 0 && (
        <section>
          <h2 className="text-header-20 font-bold text-text-primary mb-4">
            핫한 토론 주제
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {bestIssues.map((issue) => (
              <IssueCardNew key={issue.issueId} data={issue} />
            ))}
          </div>
        </section>
      )}

      {/* 실시간 토론장 (세로 리스트) */}
      {chatRooms.length > 0 && (
        <section>
          <h2 className="text-header-20 font-bold text-text-primary mb-4">
            실시간 토론장
          </h2>
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

      {/* 데이터가 하나도 없을 때 */}
      {bestIssues.length === 0 && chatRooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-body-16 text-text-secondary">
            아직 등록된 토론이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
