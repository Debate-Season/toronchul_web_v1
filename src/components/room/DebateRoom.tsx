"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchIssueRoom, type IssueRoomResponse } from "@/lib/api/room";
import { issueHref } from "@/lib/slug";
import useAuthStore from "@/store/useAuthStore";
import ThreadTabs from "@/components/room/ThreadTabs";
import ThreadVoteBar from "@/components/room/ThreadVoteBar";
import ChatRoom from "@/components/room/ChatRoom";

interface DebateRoomProps {
  issueId: number;
  /** URL 이 가리키는 토론 주제. 목록에 없으면 첫 주제로 폴백한다. */
  threadId: number;
}

/**
 * 토론방 — 이슈 하나에 하나. 상단에 토론 주제(스레드) 탭, 그 아래 선택된 주제의
 * 찬반 현황과 대화가 이어진다. 찬반 투표는 입장 조건이 아니다.
 *
 * 화면은 뷰포트에 고정된 세로 컬럼이고 메시지 목록만 스크롤한다. 그래서 높이
 * 계산을 여기서 한 번만 하고 `ChatRoom` 은 남는 높이를 채우기만 한다.
 */
export default function DebateRoom({ issueId, threadId }: DebateRoomProps) {
  const { accessToken, _hasHydrated } = useAuthStore();

  const [data, setData] = useState<IssueRoomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const reload = useCallback(() => setRetryKey((k) => k + 1), []);

  useEffect(() => {
    if (!_hasHydrated || !issueId) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchIssueRoom(issueId, accessToken);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "토론방을 불러오지 못했습니다.",
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
  }, [_hasHydrated, accessToken, issueId, retryKey]);

  if (!_hasHydrated || loading) return <DebateRoomSkeleton />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-body-16 text-red">
          {error ?? "토론방을 불러오지 못했습니다."}
        </p>
        <button
          type="button"
          onClick={reload}
          className="rounded-lg border border-border px-4 py-2 text-body-14 text-text-secondary transition-colors hover:bg-grey-90 cursor-pointer"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const backHref = issueHref(issueId, data.issueTitle);

  if (data.threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-body-16 text-text-secondary">
          아직 토론 주제가 없습니다.
        </p>
        <Link
          href={backHref}
          className="text-body-14 text-text-secondary underline"
        >
          이슈로 돌아가기
        </Link>
      </div>
    );
  }

  // URL 의 주제가 사라졌거나 이 이슈의 것이 아니면 첫 주제를 보여준다.
  // (탭 링크가 곧 올바른 URL 이므로 별도 리다이렉트는 하지 않는다.)
  const thread =
    data.threads.find((t) => t.threadId === threadId) ?? data.threads[0];

  return (
    // 높이 계산 근거는 RedditLayout 의 패딩 — 헤더 pt-14(3.5rem) + main p-4 상단(1rem)
    // + 하단 pb-20(5rem) / lg:pb-4(1rem). dvh 는 모바일 주소창 높이 변화 대응.
    <div className="flex h-[calc(100dvh-9.5rem)] flex-col lg:h-[calc(100dvh-5.5rem)]">
      {/* 이슈로 돌아가기 + 이슈 제목 */}
      <Link
        href={backHref}
        className="flex flex-shrink-0 items-center gap-1 pb-2 text-caption-12 text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={14} />
        <span className="line-clamp-1">{data.issueTitle}</span>
      </Link>

      {/* 토론 주제 탭 */}
      <ThreadTabs
        issueId={issueId}
        issueTitle={data.issueTitle}
        threads={data.threads}
        selectedThreadId={thread.threadId}
      />

      {/* 선택된 주제 + 찬반 */}
      <h1 className="flex-shrink-0 pb-2 text-body-16 font-bold text-text-primary">
        {thread.title}
      </h1>
      <ThreadVoteBar
        threadId={thread.threadId}
        agreeCount={thread.agreeCount}
        disagreeCount={thread.disagreeCount}
        myOpinion={thread.myOpinion}
        onVoted={reload}
      />

      {/* 대화 — 남는 높이를 채우고 이 안에서만 스크롤 */}
      <ChatRoom
        key={thread.threadId}
        roomId={thread.threadId}
        myOpinion={thread.myOpinion}
      />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────
function DebateRoomSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="h-4 w-32 rounded bg-grey-90 animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 w-28 shrink-0 rounded-full bg-grey-90 animate-pulse"
          />
        ))}
      </div>
      <div className="h-5 w-3/4 rounded bg-grey-90 animate-pulse" />
      <div className="h-2 w-full rounded-full bg-grey-90 animate-pulse" />
      <div className="flex gap-2">
        <div className="h-8 flex-1 rounded-lg bg-grey-90 animate-pulse" />
        <div className="h-8 flex-1 rounded-lg bg-grey-90 animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="mt-2 flex gap-2.5">
          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-grey-90 animate-pulse" />
          <div className="flex-1">
            <div className="mb-1 h-3 w-24 rounded bg-grey-90 animate-pulse" />
            <div className="h-12 rounded-2xl bg-grey-90 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
