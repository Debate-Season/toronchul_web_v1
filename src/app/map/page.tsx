"use client";

import { useEffect, useRef, useState } from "react";
import { fetchIssueMap, type IssueMapItem } from "@/lib/api/issueMap";
import IssueMapCard from "@/components/map/IssueMapCard";
import useAuthStore from "@/store/useAuthStore";

// ── 스크롤 복원 ──────────────────────────────────
/**
 * 이슈 상세에서 뒤로가기·"이슈맵으로" 로 돌아오면 보던 위치로 되돌린다.
 *
 * 목록을 마운트 뒤에 받아 그리므로 브라우저·Next 의 기본 복원이 걸리는 시점엔 페이지가 스켈레톤
 * 높이뿐이라 맨 위로 떨어진다. 그래서 (1) 받은 목록을 모듈에 들고 있다가 다시 들어오면 바로
 * 그리고, (2) 스크롤 위치를 sessionStorage 에 적어 두었다가 목록이 그려진 뒤 직접 옮긴다.
 * 탭 단위 저장이라 새 탭·새 세션은 맨 위에서 시작한다.
 */
const SCROLL_KEY = "issueMap:scrollY";
let cachedItems: IssueMapItem[] | null = null;

function readSavedScroll(): number | null {
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    const y = raw === null ? NaN : Number(raw);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

function saveScroll(y: number) {
  try {
    sessionStorage.setItem(SCROLL_KEY, String(Math.round(y)));
  } catch {
    // 저장소가 막힌 환경(시크릿 등)에서는 복원 없이 동작한다
  }
}

// ── Page ──────────────────────────────────────────
export default function IssueMapPage() {
  const { accessToken, _hasHydrated } = useAuthStore();

  const [items, setItems] = useState<IssueMapItem[]>(() => cachedItems ?? []);
  const [loading, setLoading] = useState(() => cachedItems === null);
  const [error, setError] = useState<string | null>(null);

  const [retryKey, setRetryKey] = useState(0);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    let cancelled = false;

    async function load() {
      try {
        // 들고 있는 목록이 있으면 스켈레톤 없이 그대로 두고 뒤에서 새로 받는다
        if (cachedItems === null) setLoading(true);
        setError(null);
        // Optional Auth: token이 없어도 API 호출 가능
        const data = await fetchIssueMap(accessToken);
        cachedItems = data;
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

  const ready = _hasHydrated && !loading && !error;

  // 목록이 처음 그려진 직후 한 번만 저장된 위치로 옮긴다. Next 의 이동 후 맨 위 스크롤이
  // 레이아웃 이펙트에서 먼저 돌기 때문에 다음 프레임에 옮겨야 덮이지 않는다
  useEffect(() => {
    if (!ready || restoredRef.current) return;
    // 저장값이 없으면 맨 위 — "이슈맵으로" 링크는 scroll={false} 라 이슈 페이지의 위치가 남아 있다
    const y = readSavedScroll() ?? 0;
    // 플래그는 실제로 옮긴 뒤 세운다 — StrictMode 의 이펙트 재실행이 첫 프레임을 취소하기 때문
    const frame = requestAnimationFrame(() => {
      restoredRef.current = true;
      window.scrollTo(0, y);
    });
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  // 위치는 스크롤할 때마다 적는다 — 언마운트 시점엔 Next 가 이미 다음 페이지로 스크롤을 옮겼을 수 있다.
  // 카드를 누르면 URL 이 먼저 바뀌고 이 리스너가 떨어지기 전에 맨 위 스크롤(0)이 들어오므로,
  // 주소가 이미 이슈맵이 아니면 적지 않는다
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (window.location.pathname === "/map") saveScroll(window.scrollY);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [ready]);

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
