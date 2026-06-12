"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  fetchRoomDetail,
  type RoomDetailResponse,
  type TeamScore,
} from "@/lib/api/room";
import useAuthStore from "@/store/useAuthStore";

// ── Skeleton ─────────────────────────────────────
function SkeletonShell() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="h-8 w-3/4 rounded bg-grey-90 animate-pulse" />
      <div className="h-24 rounded-2xl bg-grey-90 animate-pulse" />
      <div className="flex gap-4">
        <div className="h-12 flex-1 rounded-xl bg-grey-90 animate-pulse" />
        <div className="h-12 flex-1 rounded-xl bg-grey-90 animate-pulse" />
      </div>
      <div className="h-40 rounded-2xl bg-grey-90 animate-pulse" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────
export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, _hasHydrated } = useAuthStore();

  const [data, setData] = useState<RoomDetailResponse | null>(null);
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
        const res = await fetchRoomDetail(Number(id), accessToken);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "토론방을 불러오지 못했습니다.",
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

  const total = data.agree + data.disagree;
  const agreePercent = total > 0 ? Math.round((data.agree / total) * 100) : 50;
  const disagreePercent = 100 - agreePercent;

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

      {/* 제목 & 본문 */}
      <div>
        <h1 className="text-header-20 font-bold text-text-primary">
          {data.title}
        </h1>
        <p className="text-body-14 text-text-secondary mt-2 whitespace-pre-wrap">
          {data.content}
        </p>
        <p className="text-caption-12 text-text-secondary mt-2">
          {data.createdAt}
        </p>
      </div>

      {/* 찬반 비율 */}
      <section>
        <h2 className="text-body-16 font-semibold text-text-primary mb-3">
          찬반 현황
        </h2>
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl border border-border bg-surface-elevated p-4 text-center">
            <ThumbsUp size={20} className="mx-auto mb-1 text-blue" />
            <p className="text-header-20 font-bold text-blue">
              {agreePercent}%
            </p>
            <p className="text-caption-12 text-text-secondary">
              찬성 {data.agree}
            </p>
          </div>
          <div className="flex-1 rounded-xl border border-border bg-surface-elevated p-4 text-center">
            <ThumbsDown size={20} className="mx-auto mb-1 text-red" />
            <p className="text-header-20 font-bold text-red">
              {disagreePercent}%
            </p>
            <p className="text-caption-12 text-text-secondary">
              반대 {data.disagree}
            </p>
          </div>
        </div>
      </section>

      {/* 커뮤니티별 점수 */}
      {data.teams.length > 0 && (
        <section>
          <h2 className="text-body-16 font-semibold text-text-primary mb-3">
            커뮤니티별 점수
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.teams.map((team: TeamScore) => (
              <span
                key={team.team}
                className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-caption-12 text-text-secondary"
              >
                {team.team} {team.total}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 의견 */}
      {data.opinion && (
        <section>
          <h2 className="text-body-16 font-semibold text-text-primary mb-2">
            내 의견
          </h2>
          <p className="text-body-14 text-text-secondary">{data.opinion}</p>
        </section>
      )}
    </div>
  );
}
