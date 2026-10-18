"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquare, ArrowLeft } from "lucide-react";
import {
  fetchIssueDetail,
  type IssueDetailResponse,
} from "@/lib/api/issue";
import { imageUrl } from "@/lib/imageUrl";
import useAuthStore from "@/store/useAuthStore";
import IssueThreadList from "@/components/room/IssueThreadList";
import type { IssueRoomResponse } from "@/lib/api/room";
import { capture } from "@/lib/analytics/client";

// ── Skeleton ─────────────────────────────────────
function SkeletonShell() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="h-8 w-3/4 rounded bg-grey-90 animate-pulse" />
      <div className="flex gap-4">
        <div className="h-5 w-20 rounded bg-grey-90 animate-pulse" />
        <div className="h-5 w-20 rounded bg-grey-90 animate-pulse" />
      </div>
      <div className="h-40 rounded-2xl bg-grey-90 animate-pulse" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-grey-90 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

// ── View ──────────────────────────────────────────
/**
 * 이슈 상세 본문. 경로 판정은 서버 `page.tsx` 가 끝낸 뒤 정수 id 만 받는다.
 *
 * `initialData`·`initialRoom` 은 서버가 토큰 없이 받아 둔 값이다. 있으면 첫 렌더(SSR)
 * 부터 본문을 그려 크롤러가 읽을 수 있고, 하이드레이션 뒤 로그인 사용자 기준으로 다시 받는다.
 */
export default function IssueDetailView({
  issueId,
  initialData,
  initialRoom,
}: {
  issueId: number;
  initialData?: IssueDetailResponse;
  initialRoom?: IssueRoomResponse;
}) {
  const { accessToken, _hasHydrated } = useAuthStore();

  // 조회 성공 여부와 무관하게 "이 이슈를 열었다"는 사실을 기록한다.
  // 로드 실패까지 포함해야 이탈 지점이 보인다.
  // 같은 이슈로는 한 번만 — 중복 이유는 `DebateRoom` 의 같은 가드 참고.
  const lastViewedRef = useRef<number | null>(null);
  useEffect(() => {
    if (lastViewedRef.current === issueId) return;
    lastViewedRef.current = issueId;
    capture({ name: "issue_viewed", props: { issue_id: issueId } });
  }, [issueId]);

  const [data, setData] = useState<IssueDetailResponse | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!_hasHydrated) return;

    let cancelled = false;

    async function load() {
      try {
        // 초기 데이터가 있으면 다시 받는 동안에도 그것을 보여 준다 — 스켈레톤으로 깜빡이지 않게
        if (retryKey > 0) setLoading(true);
        setError(null);
        const res = await fetchIssueDetail(issueId, accessToken);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "이슈를 불러오지 못했습니다.",
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

  if (!data) {
    if (!_hasHydrated || loading) return <SkeletonShell />;
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-body-16 text-red">
          {error ?? "이슈를 불러오지 못했습니다."}
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

  const communityEntries = Object.entries(data.map);

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* 뒤로가기 */}
      <Link
        href="/"
        className="flex items-center gap-1 text-caption-12 text-text-secondary w-fit"
      >
        <ArrowLeft size={14} />
        홈으로
      </Link>

      {/* 헤더 */}
      <div>
        <h1 className="text-header-20 font-bold text-text-primary">
          {data.title}
        </h1>
        <div className="flex items-center gap-4 mt-2 text-caption-12 text-text-secondary">
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            토론 주제 {data.chatRoomMap.length}개
          </span>
        </div>
      </div>

      {/* 참여 커뮤니티 — 이슈 내 토론방에 참여한 사용자들의 소속 커뮤니티 아이콘 */}
      {communityEntries.length > 0 && (
        <section>
          <h2 className="text-body-16 font-semibold text-text-primary mb-3">
            참여 커뮤니티
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {communityEntries.map(([iconPath]) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={iconPath}
                src={imageUrl(iconPath)}
                alt="커뮤니티"
                width={32}
                height={32}
                className="rounded-lg object-cover"
                style={{ width: 32, height: 32 }}
              />
            ))}
          </div>
        </section>
      )}

      {/* 토론 주제 목록 → 해당 주제 탭이 열린 토론방으로 (GET /api/v2/room) */}
      <IssueThreadList issueId={issueId} initialData={initialRoom} />
    </div>
  );
}
