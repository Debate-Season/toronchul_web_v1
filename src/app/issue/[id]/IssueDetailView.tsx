"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  fetchIssueDetail,
  type IssueDetailResponse,
} from "@/lib/api/issue";
import { imageUrl } from "@/lib/imageUrl";
import useAuthStore from "@/store/useAuthStore";
import IssueThreadList from "@/components/room/IssueThreadList";
import useIssueRoom from "@/components/room/useIssueRoom";
import { RNB_SLOT_ID } from "@/lib/layoutSlots";
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
 * `wiki` 는 서버가 렌더해 둔 토론위키 본문 슬롯이다(Markdown 렌더러를 브라우저로 보내지 않는다).
 *
 * `initialData`·`initialRoom` 은 서버가 토큰 없이 받아 둔 값이다. 있으면 첫 렌더(SSR)
 * 부터 본문을 그려 크롤러가 읽을 수 있고, 하이드레이션 뒤 로그인 사용자 기준으로 다시 받는다.
 */
export default function IssueDetailView({
  issueId,
  initialData,
  initialRoom,
  wiki,
  timeline,
}: {
  issueId: number;
  initialData?: IssueDetailResponse;
  initialRoom?: IssueRoomResponse;
  /** 게시된 위키가 없으면 비운다 — 빈 안내문도 그리지 않는다(PRD v1.0.0 §4.1) */
  wiki?: ReactNode;
  /** 서버가 렌더해 둔 사건 타임라인 슬롯. 사건이 없으면 비운다(PRD v1.1.0 §3) */
  timeline?: ReactNode;
}) {
  const { accessToken, _hasHydrated } = useAuthStore();
  const room = useIssueRoom(issueId, initialRoom);

  // 우측 사이드바가 내준 자리. SSR 에는 없으므로 effect 로 잡는다(토론방과 같은 방식)
  const [rnbSlot, setRnbSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setRnbSlot(document.getElementById(RNB_SLOT_ID));
  }, []);

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

  // 참여 커뮤니티 + 토론 주제는 우측 사이드바("실시간 핫한 토론" 자리)에 놓는다. 사이드바가
  // 없는 `md` 미만에서는 본문 끝에 같은 내용을 둔다 — CSS 로 한쪽만 보인다. 포털은 마운트
  // 뒤에만 그려져 서버 HTML 에 없으므로, 크롤러가 읽는 토론 주제 링크는 본문 쪽이다.
  const sidebar = (
    <div className="flex flex-col gap-6">
      {communityEntries.length > 0 && (
        <section>
          <h2 className="mb-3 text-header-20 font-bold text-text-primary">
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
      <IssueThreadList
        data={room.data}
        pending={room.pending}
        error={room.error}
        onRetry={room.retry}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-10 py-4">
      {/* 뒤로가기 + 헤더. 토론 주제 수는 우측 사이드바의 토론 주제 제목으로 옮겼다 */}
      <div className="flex flex-col gap-3">
        <Link
          href="/map"
          className="flex items-center gap-1 text-caption-12 text-text-secondary w-fit"
        >
          <ArrowLeft size={14} />
          이슈맵으로
        </Link>
        <h1 className="text-header-28 font-bold text-text-primary">{data.title}</h1>
      </div>

      {/* 사건 타임라인 — 가장 위. "최근 무슨 일이 있었나" 가 이슈 페이지의 첫 정보다 */}
      {timeline}

      {/* 토론위키 — 이슈를 설명하는 본문(배경). 크롤러가 읽는 본문의 대부분이 여기서 나온다 */}
      {wiki}

      <div className="md:hidden">{sidebar}</div>
      {rnbSlot && createPortal(sidebar, rnbSlot)}
    </div>
  );
}
