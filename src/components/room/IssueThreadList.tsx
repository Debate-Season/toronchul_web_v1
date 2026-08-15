"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchIssueRoom, type IssueRoomResponse } from "@/lib/api/room";
import { threadHref } from "@/lib/slug";
import useAuthStore from "@/store/useAuthStore";
import DeVoteGauge from "@/components/TDS/DeVoteGauge";

interface IssueThreadListProps {
  issueId: number;
}

/**
 * 이슈 상세의 토론 주제 목록. 주제를 고르면 그 주제 탭이 열린 토론방으로 간다.
 *
 * 찬반 수치는 `GET /api/v2/room` 이 스레드마다 이미 내려주므로 여기서 방별로
 * 추가 조회를 하지 않는다.
 */
export default function IssueThreadList({ issueId }: IssueThreadListProps) {
  const { accessToken, _hasHydrated } = useAuthStore();

  const [data, setData] = useState<IssueRoomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

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

  if (!_hasHydrated || loading) return <ListSkeleton />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-body-14 text-red">
          {error ?? "토론방을 불러오지 못했습니다."}
        </p>
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
      <h2 className="mb-3 text-body-16 font-semibold text-text-primary">
        토론 주제
      </h2>
      <div className="flex flex-col gap-3">
        {data.threads.map((thread) => (
          <Link
            key={thread.threadId}
            href={threadHref(
              issueId,
              data.issueTitle,
              thread.threadId,
              thread.title,
            )}
          >
            <article className="rounded-2xl border border-border bg-surface-elevated p-4 transition-colors hover:border-grey-70">
              <h3 className="mb-3 line-clamp-2 text-body-16 font-semibold text-text-primary">
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
