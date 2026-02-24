"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import IssueCard from "@/components/home/IssueCard";
import IssueCardNew from "@/components/home/IssueCardNew";
import { fetchHomeRefresh, type HomeRefreshData } from "@/lib/api/home";
import useAuthStore from "@/store/useAuthStore";

// ── Page ──────────────────────────────────────────
export default function Home() {
  const { accessToken, _hasHydrated } = useAuthStore();

  const [homeData, setHomeData] = useState<HomeRefreshData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return; // 스토어 복원 대기

    // 비로그인 → API 호출 불필요 (서버가 401 반환)
    if (!accessToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchHomeRefresh(accessToken);
        if (!cancelled) setHomeData(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.",
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
  }, [_hasHydrated, accessToken]);

  // ── Hydration 대기 / Loading ──
  if (!_hasHydrated || loading) {
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

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-body-16 text-red">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-body-14 text-brand underline cursor-pointer"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!homeData) return null;

  const { top5BestIssueRooms, chatRoomResponse } = homeData;

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* 핫한 토론 주제 (가로 스크롤) */}
      {top5BestIssueRooms.length > 0 && (
        <section>
          <h2 className="text-header-20 font-bold text-text-primary mb-4">
            핫한 토론 주제
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {top5BestIssueRooms.map((issue) => (
              <IssueCardNew key={issue.issueId} data={issue} />
            ))}
          </div>
        </section>
      )}

      {/* 실시간 토론장 (세로 리스트) */}
      {chatRoomResponse.length > 0 && (
        <section>
          <h2 className="text-header-20 font-bold text-text-primary mb-4">
            실시간 토론장
          </h2>
          <div className="flex flex-col gap-3">
            {chatRoomResponse.map((room) => (
              <IssueCard key={room.chatRoomId} data={room} />
            ))}
          </div>
        </section>
      )}

      {/* 데이터가 하나도 없을 때 */}
      {top5BestIssueRooms.length === 0 && chatRoomResponse.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-body-16 text-text-secondary">
            아직 등록된 토론이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
