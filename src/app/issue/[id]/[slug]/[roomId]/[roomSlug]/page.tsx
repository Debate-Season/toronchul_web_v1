"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  fetchRoomDetail,
  type RoomDetailResponse,
} from "@/lib/api/room";
import { fromBase36, issueHref } from "@/lib/slug";
import useAuthStore from "@/store/useAuthStore";

// ── 찬반 비율 ──────────────────────────────────────
function getPercentages(agree: number, disagree: number) {
  const total = agree + disagree;
  if (total === 0) return { agreePercent: 50, disagreePercent: 50 };
  const agreePercent = Math.round((agree / total) * 100);
  return { agreePercent, disagreePercent: 100 - agreePercent };
}

// ── Skeleton ─────────────────────────────────────
function SkeletonShell() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="h-4 w-16 rounded bg-grey-90 animate-pulse" />
      <div className="h-8 w-3/4 rounded bg-grey-90 animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-grey-90 animate-pulse" />
      <div className="h-3 w-full rounded-full bg-grey-90 animate-pulse" />
      <div className="h-40 rounded-2xl bg-grey-90 animate-pulse" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────
export default function RoomDetailPage() {
  const { id, slug, roomId } = useParams<{
    id: string;
    slug: string;
    roomId: string;
    roomSlug: string;
  }>();
  const { accessToken, _hasHydrated } = useAuthStore();

  const [data, setData] = useState<RoomDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!_hasHydrated || !roomId) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchRoomDetail(fromBase36(roomId), accessToken);
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
  }, [_hasHydrated, accessToken, roomId, retryKey]);

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

  const { agreePercent, disagreePercent } = getPercentages(
    data.agree,
    data.disagree,
  );
  const issueBackHref = issueHref(fromBase36(id), decodeURIComponent(slug));

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* 뒤로가기 (이슈 페이지로) */}
      <Link
        href={issueBackHref}
        className="flex items-center gap-1 text-caption-12 text-text-secondary w-fit"
      >
        <ArrowLeft size={14} />
        이슈로 돌아가기
      </Link>

      {/* 헤더 */}
      <div>
        <h1 className="text-header-20 font-bold text-text-primary">
          {data.title}
        </h1>
        {data.content && (
          <p className="text-body-14 text-text-secondary mt-2">
            {data.content}
          </p>
        )}
      </div>

      {/* 찬반 비율 */}
      <section>
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          <div
            className="bg-red transition-all"
            style={{ width: `${agreePercent}%` }}
          />
          <div
            className="bg-blue transition-all"
            style={{ width: `${disagreePercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-body-14 font-semibold text-red">
            찬성 {data.agree}명 ({agreePercent}%)
          </span>
          <span className="text-body-14 font-semibold text-blue">
            반대 {data.disagree}명 ({disagreePercent}%)
          </span>
        </div>
      </section>

      {/* 팀 점수 */}
      {data.teams.length > 0 && (
        <section>
          <h2 className="text-body-16 font-semibold text-text-primary mb-3">
            팀 점수
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.teams.map((team) => (
              <div
                key={team.team}
                className="rounded-2xl border border-border bg-surface-elevated p-4"
              >
                <h3 className="text-body-14 font-semibold text-text-primary mb-2 capitalize">
                  {team.team === "agree" ? "찬성팀" : "반대팀"}
                </h3>
                <div className="flex flex-col gap-1 text-caption-12 text-text-secondary">
                  <span>종합 {team.total}점</span>
                  <span>논리력 {team.logic}점</span>
                  <span>태도 {team.attitude}점</span>
                  {team.mvp && <span>MVP: {team.mvp}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
