"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchIssueRoom, type IssueRoomResponse } from "@/lib/api/room";
import { issueHref } from "@/lib/slug";
import { RNB_SLOT_ID } from "@/lib/layoutSlots";
import useAuthStore from "@/store/useAuthStore";
import { capture } from "@/lib/analytics/client";
import ThreadTabs from "@/components/room/ThreadTabs";
import ThreadPanel from "@/components/room/ThreadPanel";
import ChatRoom from "@/components/room/ChatRoom";

interface DebateRoomProps {
  issueId: number;
  /** URL 이 가리키는 토론 주제. 목록에 없으면 첫 주제로 폴백한다. */
  threadId: number;
}

/**
 * URL 의 주제가 사라졌거나 이 이슈의 것이 아니면 첫 주제를 보여준다.
 * (탭 링크가 곧 올바른 URL 이므로 별도 리다이렉트는 하지 않는다.)
 * 주제가 하나도 없으면 undefined.
 */
function resolveThread(
  threads: IssueRoomResponse["threads"],
  threadId: number,
): IssueRoomResponse["threads"][number] | undefined {
  return threads.find((t) => t.threadId === threadId) ?? threads[0];
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

  // 우측 사이드바가 내준 자리. 레이아웃이 먼저 렌더되므로 마운트 시점에 이미
  // 존재하지만, SSR 에는 없으므로 effect 로 잡는다.
  const [rnbSlot, setRnbSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setRnbSlot(document.getElementById(RNB_SLOT_ID));
  }, []);

  // 열린 주제를 기록한다. 탭 전환도 여기서 잡히므로 주제별 조회가 그대로 쌓인다.
  useEffect(() => {
    if (!issueId || !threadId) return;
    capture({
      name: "thread_opened",
      props: { issue_id: issueId, thread_id: threadId },
    });
  }, [issueId, threadId]);

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

  const thread = resolveThread(data.threads, threadId);

  if (!thread) {
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

  return (
    // 높이 계산 근거는 RedditLayout 의 패딩 — 헤더 pt-14(3.5rem) + main p-4
    // 상하(1rem + 1rem). 하단 고정 탭이 햄버거 메뉴로 바뀌면서 모바일 전용
    // pb-20 이 사라져 브레이크포인트 분기 없이 한 값이 됐다.
    // dvh 는 모바일 주소창 높이 변화 대응 — vh 면 주소창이 접힐 때 입력창이 잘린다.
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col">
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

      {/*
        주제·찬반·투표는 우측 사이드바에 그린다. 사이드바가 없는 `md` 미만에서만
        본문 상단에 같은 패널을 놓는다 — 안 그러면 투표에 닿을 수 없다.
        CSS 로 한쪽만 표시되므로 보조기술에도 하나만 노출된다.
      */}
      <div className="flex-shrink-0 pb-3 md:hidden">
        <ThreadPanel thread={thread} onVoted={reload} />
      </div>
      {rnbSlot &&
        createPortal(<ThreadPanel thread={thread} onVoted={reload} />, rnbSlot)}

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
      {/* 주제 패널 — 데스크톱에서는 사이드바에 있으므로 본문 스켈레톤은 모바일만 */}
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4 md:hidden">
        <div className="h-5 w-3/4 rounded bg-grey-90 animate-pulse" />
        <div className="h-2 w-full rounded-full bg-grey-90 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 flex-1 rounded-lg bg-grey-90 animate-pulse" />
          <div className="h-8 flex-1 rounded-lg bg-grey-90 animate-pulse" />
        </div>
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
