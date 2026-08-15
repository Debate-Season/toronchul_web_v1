"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare, ArrowLeft } from "lucide-react";
import {
  fetchIssueDetail,
  type IssueDetailResponse,
} from "@/lib/api/issue";
import { fromBase36 } from "@/lib/slug";
import { imageUrl } from "@/lib/imageUrl";
import useAuthStore from "@/store/useAuthStore";
import IssueThreadList from "@/components/room/IssueThreadList";

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

// ── Page ──────────────────────────────────────────
export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, _hasHydrated } = useAuthStore();

  const [data, setData] = useState<IssueDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!_hasHydrated) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchIssueDetail(fromBase36(id), accessToken);
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
  }, [_hasHydrated, accessToken, id, retryKey]);

  if (!_hasHydrated || loading) return <SkeletonShell />;

  if (error || !data) {
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
      <IssueThreadList issueId={fromBase36(id)} />
    </div>
  );
}
