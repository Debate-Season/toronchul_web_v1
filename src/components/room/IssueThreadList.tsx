"use client";

import Link from "next/link";
import type { IssueRoomResponse } from "@/lib/api/room";
import { debateHref } from "@/lib/routes";
import DeVoteGauge from "@/components/TDS/DeVoteGauge";

interface IssueThreadListProps {
  /** `useIssueRoom` 이 받은 목록. 없으면 `pending`·`error` 로 상태를 그린다 */
  data: IssueRoomResponse | null;
  pending: boolean;
  error: string | null;
  onRetry: () => void;
}

/**
 * 이슈 상세의 토론 주제 목록. 주제를 고르면 그 주제 탭이 열린 토론방으로 간다.
 *
 * 데이터는 부모가 `useIssueRoom` 으로 받아 내려준다 — 같은 목록이 모바일 본문과 데스크톱
 * 우측 사이드바 두 자리에 그려지기 때문이다. 찬반 수치는 `GET /api/v2/room` 이 스레드마다
 * 이미 내려주므로 방별로 추가 조회하지 않는다.
 */
export default function IssueThreadList({
  data,
  pending,
  error,
  onRetry,
}: IssueThreadListProps) {
  if (!data) {
    if (pending) return <ListSkeleton />;
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-body-14 text-red">
          {error ?? "토론방을 불러오지 못했습니다."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-border px-4 py-2 text-body-14 text-text-secondary transition-colors hover:bg-grey-90 cursor-pointer"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (data.threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-body-16 text-text-secondary">
          아직 토론 주제가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-header-20 font-bold text-text-primary">
        토론 주제 {data.threads.length}개
      </h2>
      <div className="flex flex-col gap-3">
        {data.threads.map((thread) => (
          <Link
            key={thread.threadId}
            href={debateHref(thread.threadId)}
          >
            <article className="rounded-2xl border border-border bg-surface-elevated p-4 transition-colors hover:border-grey-70">
              <h3 className="mb-3 line-clamp-2 text-header-18 font-semibold text-text-primary">
                {thread.title}
              </h3>
              <DeVoteGauge
                agree={thread.agreeCount}
                disagree={thread.disagreeCount}
                size="md"
              />
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Skeleton ──────────────────────────────────────
function ListSkeleton() {
  return (
    <section>
      <div className="mb-3 h-5 w-20 rounded bg-grey-90 animate-pulse" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-grey-90 animate-pulse" />
        ))}
      </div>
    </section>
  );
}
