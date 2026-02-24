"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchIssueMap, type IssueMapItem } from "@/lib/api/issueMap";
import IssueMapCard from "@/components/map/IssueMapCard";
import useAuthStore from "@/store/useAuthStore";

// ── Page ──────────────────────────────────────────
export default function IssueMapPage() {
  const { accessToken, _hasHydrated } = useAuthStore();

  const [items, setItems] = useState<IssueMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!accessToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchIssueMap(accessToken);
        if (!cancelled) setItems(data);
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
  }, [_hasHydrated, accessToken]);

  // ── Hydration 대기 / Loading ──
  if (!_hasHydrated || loading) {
    return (
      <div className="flex flex-col gap-6 py-4">
        <div className="h-8 w-32 rounded bg-grey-90 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-grey-90 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── 비로그인: 로그인 유도 ──
  if (!accessToken) {
    return (
      <div className="flex flex-col gap-6 py-4">
        <h1 className="text-header-20 font-bold text-text-primary">
          이슈맵
        </h1>
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-body-14 text-text-secondary text-center">
            로그인하면 다양한 이슈를 확인할 수 있습니다.
          </p>
          <Link
            href="/login"
            className="rounded-lg bg-brand px-6 py-2.5 text-body-14 font-semibold text-white transition-colors hover:opacity-90"
          >
            로그인하기
          </Link>
        </div>
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
    <div className="flex flex-col gap-6 py-4">
      <h1 className="text-header-20 font-bold text-text-primary">
        이슈맵
      </h1>

      {/* 이슈 그리드 */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <IssueMapCard key={item.issueId} data={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-body-16 text-text-secondary">
            아직 등록된 이슈가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
