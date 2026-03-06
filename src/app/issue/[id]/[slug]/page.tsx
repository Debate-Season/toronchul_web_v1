"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Bookmark, ArrowLeft } from "lucide-react";
import {
  fetchIssueDetail,
  type IssueDetailResponse,
  type ChatRoomInIssue,
} from "@/lib/api/issue";
import { fromBase36, roomHref, issueHref } from "@/lib/slug";
import useAuthStore from "@/store/useAuthStore";

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
            <Bookmark size={12} />
            {data.bookMarks}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            {data.chats}
          </span>
        </div>
      </div>

      {/* 커뮤니티 반응 */}
      {communityEntries.length > 0 && (
        <section>
          <h2 className="text-body-16 font-semibold text-text-primary mb-3">
            커뮤니티 반응
          </h2>
          <div className="flex flex-wrap gap-2">
            {communityEntries.map(([community, count]) => (
              <span
                key={community}
                className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-caption-12 text-text-secondary"
              >
                {community} {count}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 토론방 목록 */}
      {data.chatRoomMap.length > 0 && (
        <section>
          <h2 className="text-body-16 font-semibold text-text-primary mb-3">
            토론방
          </h2>
          <div className="flex flex-col gap-3">
            {data.chatRoomMap.map((room: ChatRoomInIssue) => (
              <Link key={room.chatRoomId} href={roomHref(fromBase36(id), data.title, room.chatRoomId, room.title)}>
                <article className="rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-colors hover:border-grey-70">
                  <h3 className="text-body-16 font-semibold text-text-primary mb-1 line-clamp-2">
                    {room.title}
                  </h3>
                  <p className="text-caption-12 text-text-secondary mb-3 line-clamp-2">
                    {room.content}
                  </p>
                  <div className="flex items-center gap-3 text-caption-12 text-text-secondary">
                    <span>찬성 {room.agree}</span>
                    <span>반대 {room.disagree}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {room.time}
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.chatRoomMap.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-body-16 text-text-secondary">
            아직 토론방이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
