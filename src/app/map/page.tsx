"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchIssueMap, type IssueMapItem } from "@/lib/api/issueMap";
import IssueMapCard from "@/components/map/IssueMapCard";
import useAuthStore from "@/store/useAuthStore";

// ── Page ──────────────────────────────────────────
export default function IssueMapPage() {
  const { accessToken } = useAuthStore();

  const [items, setItems] = useState<IssueMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
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
  }, [accessToken]);

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const set = new Set(items.map((item) => item.category));
    return Array.from(set).sort();
  }, [items]);

  // 필터링된 목록
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-4">
        <div className="h-8 w-32 rounded bg-grey-90 animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-16 rounded-full bg-grey-90 animate-pulse"
            />
          ))}
        </div>
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

      {/* 카테고리 필터 */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-caption-12 font-medium transition-colors cursor-pointer ${
              selectedCategory === null
                ? "bg-brand text-white"
                : "bg-grey-90 text-text-secondary hover:text-text-primary"
            }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-caption-12 font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-brand text-white"
                  : "bg-grey-90 text-text-secondary hover:text-text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 이슈 그리드 */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <IssueMapCard key={item.id} data={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-body-16 text-text-secondary">
            {selectedCategory
              ? `'${selectedCategory}' 카테고리에 해당하는 이슈가 없습니다.`
              : "아직 등록된 이슈가 없습니다."}
          </p>
        </div>
      )}
    </div>
  );
}
