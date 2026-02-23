"use client";

import { useEffect, useState } from "react";
import IssueCard, { type ChatRoomResponse } from "@/components/home/IssueCard";
import IssueCardNew, {
  type BestIssueRoom,
} from "@/components/home/IssueCardNew";
import { fetchBestIssues, fetchChatRooms } from "@/lib/api/home";
import useAuthStore from "@/store/useAuthStore";

// ── Page ──────────────────────────────────────────
export default function Home() {
  const { accessToken } = useAuthStore();

  const [bestIssues, setBestIssues] = useState<BestIssueRoom[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [issues, rooms] = await Promise.all([
          fetchBestIssues(accessToken),
          fetchChatRooms(accessToken),
        ]);

        if (!cancelled) {
          setBestIssues(issues);
          setChatRooms(rooms);
        }
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
  }, [accessToken]);

  // ── Loading ──
  if (loading) {
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

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* 핫한 토론 주제 (가로 스크롤) */}
      {bestIssues.length > 0 && (
        <section>
          <h2 className="text-header-20 font-bold text-text-primary mb-4">
            🔥 핫한 토론 주제
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {bestIssues.map((issue) => (
              <IssueCardNew key={issue.id} data={issue} />
            ))}
          </div>
        </section>
      )}

      {/* 실시간 토론장 (세로 리스트) */}
      {chatRooms.length > 0 && (
        <section>
          <h2 className="text-header-20 font-bold text-text-primary mb-4">
            💬 실시간 토론장
          </h2>
          <div className="flex flex-col gap-3">
            {chatRooms.map((room) => (
              <IssueCard key={room.id} data={room} />
            ))}
          </div>
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
