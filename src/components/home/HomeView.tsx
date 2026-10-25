"use client";

import { useEffect, useMemo, useState } from "react";
import IssueCardNew from "@/components/home/IssueCardNew";
import YoutubeLiveCard from "@/components/home/YoutubeLiveCard";
import RecommendDebateCard, {
  type DebateVote,
} from "@/components/home/RecommendDebateCard";
import DeHorizontalCarousel from "@/components/TDS/DeHorizontalCarousel";
import {
  fetchHome,
  fetchMedia,
  fetchBestChatRooms,
  type IssueRoom,
  type BestChatRoom,
  type MediaResponse,
} from "@/lib/api/home";
import EventCard from "@/components/home/EventCard";
import { fetchRoomDetail } from "@/lib/api/room";
import type { RecentEvent } from "@/lib/api/article";
import useAuthStore from "@/store/useAuthStore";
import { Radio, Siren, Lightbulb, MessagesSquare } from "lucide-react";

/** 후보 중 하나를 무작위로 고른다. 비었으면 null */
function pickRandom<T>(candidates: readonly T[]): T | null {
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

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

// ── Page ──────────────────────────────────────────
export default function HomeView({
  recentEvents,
}: {
  /** 최근 생성된 사건 후보 — 서버(`app/page.tsx`)가 모아 넘긴다 */
  recentEvents: RecentEvent[];
}) {
  const { accessToken, _hasHydrated } = useAuthStore();

  // "사건 발생!" — 최근 사건 후보 중 랜덤 1개 (다른 섹션처럼 들어올 때마다 다시 뽑는다).
  // 하이드레이션 전에는 스켈레톤만 그리므로 서버·클라이언트 값이 달라도 어긋나지 않는다
  const pickedEvent = useMemo(() => pickRandom(recentEvents), [recentEvents]);

  const [issueRooms, setIssueRooms] = useState<IssueRoom[]>([]);
  const [bestChatRooms, setBestChatRooms] = useState<BestChatRoom[]>([]);
  const [mediaResponse, setMediaResponse] = useState<MediaResponse>({ youtubeLive: [], items: [] });
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

  // 실시간 미디어(`items`)는 뉴스(`/news`)로 옮겼다 — 홈은 같은 응답의 라이브만 쓴다
  const youtubeLive = mediaResponse.youtubeLive;
  const hasAnyData =
    youtubeLive.length > 0 ||
    pickedEvent !== null ||
    bestChatRooms.length > 0 ||
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
          <DeHorizontalCarousel perView={2}>
            {youtubeLive.map((item) => (
              <YoutubeLiveCard key={item.id} data={item} />
            ))}
          </DeHorizontalCarousel>
        </section>
      )}

      {/* ①-b 사건 발생! — 최근 생성된 사건 5개 중 랜덤 1개 */}
      {pickedEvent && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Siren size={20} className="text-red" />
            <h2 className="text-header-20 font-bold text-text-primary">
              사건 발생!
            </h2>
          </div>
          <EventCard data={pickedEvent} />
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
