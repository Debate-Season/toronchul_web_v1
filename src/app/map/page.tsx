"use client";

import { useEffect, useState } from "react";
import { fetchIssueMap, type IssueMapItem } from "@/lib/api/issueMap";
import IssueMapCard from "@/components/map/IssueMapCard";
import useAuthStore from "@/store/useAuthStore";

// ── Page ──────────────────────────────────────────
export default function IssueMapPage() {
  const { accessToken, _hasHydrated } = useAuthStore();

  const [items, setItems] = useState<IssueMapItem[]>([]);
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
        // Optional Auth: token이 없어도 API 호출 가능
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
  }, [_hasHydrated, accessToken, retryKey]);

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

  // ── Error ──
  if (error) {
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

  // 잠자는 이슈(DORMANT)는 숨김이 아니라 분류다 — 목록 아래 별도 섹션으로 모은다.
  // 백엔드가 응답의 status 로만 알려 주고 목록에서 거르지 않는다(IssueStatus 주석)
  const active = items.filter((item) => item.status !== "DORMANT");
  const dormant = items.filter((item) => item.status === "DORMANT");

  return (
    <div className="flex flex-col gap-6 py-4">
      <h1 className="text-header-20 font-bold text-text-primary">
        이슈맵
      </h1>

      {/* 이슈 그리드 */}
      {items.length > 0 ? (
        <>
          {active.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {active.map((item) => (
                <IssueMapCard key={item.issueId} data={item} />
              ))}
            </div>
          )}

          {dormant.length > 0 && (
            <section aria-labelledby="dormant-heading" className="flex flex-col gap-3 pt-4">
              <div>
                <h2
                  id="dormant-heading"
                  className="text-body-16 font-semibold text-text-primary"
                >
                  잠자는 이슈 {dormant.length}
                </h2>
                <p className="mt-1 text-caption-12 text-text-secondary">
                  한동안 새 사건이 없는 이슈예요. 토론과 위키는 그대로 볼 수 있어요.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dormant.map((item) => (
                  <IssueMapCard key={item.issueId} data={item} muted />
                ))}
              </div>
            </section>
          )}
        </>
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
