"use client";

import { useEffect, useState } from "react";
import { fetchIssueRoom, type IssueRoomResponse } from "@/lib/api/room";
import useAuthStore from "@/store/useAuthStore";

/**
 * 이슈의 토론 주제 목록(`GET /api/v2/room`)을 받는다.
 *
 * 화면이 같은 목록을 두 자리(모바일 본문 · 데스크톱 우측 사이드바)에 그리므로 목록
 * 컴포넌트가 각자 받지 않고 부모가 이 훅으로 한 번만 받아 내려준다.
 *
 * `initialData` 는 서버가 토큰 없이 받아 둔 값이다. 있으면 첫 렌더(SSR)부터 쓰고,
 * 하이드레이션 뒤 로그인 기준(내 투표)으로 다시 받는다 — 그동안 스켈레톤으로 깜빡이지 않는다.
 */
export default function useIssueRoom(issueId: number, initialData?: IssueRoomResponse) {
  const { accessToken, _hasHydrated } = useAuthStore();

  const [data, setData] = useState<IssueRoomResponse | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!_hasHydrated || !issueId) return;

    let cancelled = false;

    async function load() {
      try {
        if (retryKey > 0) setLoading(true);
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

  return {
    data,
    /** 첫 데이터를 기다리는 중 (하이드레이션 전 포함) */
    pending: !data && (!_hasHydrated || loading),
    error,
    retry: () => setRetryKey((k) => k + 1),
  };
}
