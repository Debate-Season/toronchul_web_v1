"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { fetchMessages, type ChatMessage } from "@/lib/api/chat";
import { fetchRoomDetail } from "@/lib/api/room";
import { imageColorFromEngName } from "@/lib/profile/constants";
import { imageUrl } from "@/lib/imageUrl";
import LoginModal from "@/components/auth/LoginModal";

// userCommunity 가 아이콘 경로인지(방어적) — 아니면 이름 텍스트로 취급.
function isImagePath(s: string): boolean {
  return /\/|\.(png|jpe?g|webp|svg)$/i.test(s);
}

// timeStamp 가 ISO면 HH:mm, 아니면 원문.
function fmtTime(ts: string): string {
  const m = ts.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : ts;
}

/**
 * 토론방 채팅 화면 (입장 후). 메시지 조회.
 * 메시지 전송은 실시간(STOMP over WebSocket) 영역이라 별도 — 현재는 읽기.
 * (반응 기능은 이번 범위 아님 — 숨김.)
 * 필드 값 형식(userCommunity/profileColor)은 방어적으로 렌더(로그인 응답 검증 후 조정).
 */
export default function ChatRoom({ roomId }: { roomId: number }) {
  const router = useRouter();
  const { accessToken, isLogin, _hasHydrated } = useAuthStore();

  const [title, setTitle] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isLogin) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [room, msgs] = await Promise.all([
          fetchRoomDetail(roomId, accessToken).catch(() => null),
          fetchMessages(roomId, null, accessToken),
        ]);
        if (cancelled) return;
        if (room) setTitle(room.title);
        setMessages(msgs.items);
        setCursor(msgs.nextCursor);
        setHasMore(msgs.hasMore);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "메시지를 불러오지 못했습니다.",
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
  }, [_hasHydrated, isLogin, accessToken, roomId, retryKey]);

  const loadMore = async () => {
    if (loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const msgs = await fetchMessages(roomId, cursor, accessToken);
      // 이전(과거) 대화 → 위에 붙임.
      setMessages((prev) => [...msgs.items, ...prev]);
      setCursor(msgs.nextCursor);
      setHasMore(msgs.hasMore);
    } catch {
      // 더보기 실패는 조용히 무시
    } finally {
      setLoadingMore(false);
    }
  };

  if (!_hasHydrated || loading) return <ChatSkeleton />;

  if (!isLogin) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-body-16 font-medium text-text-primary">
          로그인 후 이용할 수 있어요.
        </p>
        <button
          type="button"
          onClick={() => setShowLogin(true)}
          className="rounded-lg bg-brand px-6 py-2.5 text-body-14 font-semibold text-white transition-colors hover:opacity-90 cursor-pointer"
        >
          로그인하기
        </button>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 py-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push(`/room/${roomId}`)}
          aria-label="뒤로"
          className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="line-clamp-1 text-body-16 font-bold text-text-primary">
          {title || "토론방"}
        </h1>
      </div>

      {error && (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-body-14 text-red">{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="rounded-lg border border-border px-4 py-2 text-body-14 text-text-secondary transition-colors hover:bg-grey-90 cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex flex-1 flex-col gap-3">
        {hasMore && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mx-auto rounded-full border border-border px-4 py-1.5 text-caption-12 text-text-secondary transition-colors hover:bg-grey-90 disabled:opacity-60 cursor-pointer"
          >
            {loadingMore ? "불러오는 중…" : "이전 대화 더 보기"}
          </button>
        )}

        {!error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-body-14 text-text-secondary">
              아직 대화가 없어요. 첫 메시지를 남겨보세요.
            </p>
          </div>
        )}

        {messages.map((msg) =>
          msg.messageType === "CHAT" ? (
            <MessageRow key={msg.id} msg={msg} />
          ) : (
            <SystemRow key={msg.id} msg={msg} />
          ),
        )}
      </div>

      {/* 입력 (실시간 전송은 준비 중) */}
      <div className="sticky bottom-0 border-t border-border bg-surface pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-3">
          <input
            type="text"
            disabled
            placeholder="실시간 채팅 전송은 준비 중이에요"
            className="flex-1 bg-transparent text-body-14 text-text-secondary outline-none placeholder:text-text-secondary"
          />
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

// ── 일반 메시지 ───────────────────────────────────
function MessageRow({ msg }: { msg: ChatMessage }) {
  const color = imageColorFromEngName(msg.profileColor);
  const opinionBadge =
    msg.opinionType === "AGREE"
      ? { label: "찬성", cls: "text-red" }
      : msg.opinionType === "DISAGREE"
        ? { label: "반대", cls: "text-blue" }
        : null;

  return (
    <div className="flex gap-2.5">
      {/* 아바타 */}
      <div
        className={`${color.bgClass} flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-caption-12 font-bold text-white`}
      >
        {msg.sender.slice(0, 1)}
      </div>

      <div className="min-w-0 flex-1">
        {/* 상단: 커뮤니티 + 닉네임 + 의견 + 시간 */}
        <div className="mb-1 flex items-center gap-1.5">
          {msg.userCommunity && isImagePath(msg.userCommunity) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl(msg.userCommunity)}
              alt=""
              width={16}
              height={16}
              className="rounded object-cover"
              style={{ width: 16, height: 16 }}
            />
          ) : (
            msg.userCommunity && (
              <span className="text-caption-12 text-text-secondary">
                {msg.userCommunity}
              </span>
            )
          )}
          <span className="text-caption-12 font-semibold text-text-primary">
            {msg.sender}
          </span>
          {opinionBadge && (
            <span className={`text-caption-12 font-medium ${opinionBadge.cls}`}>
              {opinionBadge.label}
            </span>
          )}
          <span className="ml-auto text-caption-12 text-text-secondary">
            {fmtTime(msg.timeStamp)}
          </span>
        </div>

        {/* 본문 */}
        <div className="rounded-2xl rounded-tl-md bg-surface-elevated px-3.5 py-2.5">
          <p className="whitespace-pre-wrap break-words text-body-14 text-text-primary">
            {msg.content}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── 시스템 메시지 (입장/퇴장/에러) ─────────────────
function SystemRow({ msg }: { msg: ChatMessage }) {
  const text =
    msg.messageType === "JOIN"
      ? `${msg.sender}님이 입장했어요`
      : msg.messageType === "LEAVE"
        ? `${msg.sender}님이 나갔어요`
        : msg.content;
  return (
    <p className="py-1 text-center text-caption-12 text-text-secondary">
      {text}
    </p>
  );
}

// ── Skeleton ──────────────────────────────────────
function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="h-6 w-1/2 rounded bg-grey-90 animate-pulse" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-2.5">
          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-grey-90 animate-pulse" />
          <div className="flex-1">
            <div className="mb-1 h-3 w-24 rounded bg-grey-90 animate-pulse" />
            <div className="h-12 rounded-2xl bg-grey-90 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
