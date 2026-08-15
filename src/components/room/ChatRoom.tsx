"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { fetchMessages, type ChatMessage } from "@/lib/api/chat";
import {
  createChatSocket,
  type ChatSocket,
  type ChatSocketStatus,
} from "@/lib/api/chatSocket";
import { getMyProfile } from "@/lib/api/profile";
import { imageColorFromEngName } from "@/lib/profile/constants";
import { imageUrl } from "@/lib/imageUrl";
import LoginModal from "@/components/auth/LoginModal";

// userCommunity 가 아이콘 경로인지(방어적) — 아니면 이름 텍스트로 취급.
function isImagePath(s: string): boolean {
  return /\/|\.(png|jpe?g|webp|svg)$/i.test(s);
}

/**
 * 서버는 한 페이지를 최신→과거(내림차순)로 주므로 화면 정렬(과거→최신)로 뒤집는다.
 * 커서로 받는 다음 페이지도 같은 정렬이라 뒤집은 뒤 목록 앞에 붙이면 된다.
 */
function toAscending(items: ChatMessage[]): ChatMessage[] {
  return [...items].reverse();
}

/** 서버가 타임존 없이 내려주는 시각의 실제 기준 타임존. */
const SERVER_TZ_OFFSET = "+09:00";

/**
 * 서버 timeStamp 를 Date 로 파싱.
 *
 * 서버는 **KST 벽시계 시각을 타임존 표기 없이** 내려준다
 * (2026-07-21 00:16 KST → "2026-07-21 00:16:15.458502").
 * 따라서 타임존이 없으면 KST(+09:00) 로 간주해야 한다.
 * `Z` 를 붙여 UTC 로 간주하면 9시간 앞서 표시된다(모바일 00:16 ↔ 웹 09:16).
 *
 * 관측된 형태:
 *   "2026-07-18 07:49:15.458502"   소켓 프레임(공백 구분, 마이크로초)
 *   "2026-07-18T07:49:15Z"         ISO (타임존 표기가 있으면 그대로 신뢰)
 */
function parseTimestamp(ts: string): Date | null {
  const normalized = ts.trim().replace(" ", "T");
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized);
  const d = new Date(hasZone ? normalized : `${normalized}${SERVER_TZ_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * KST 기준 HH:mm. 파싱 실패 시 빈 문자열.
 *
 * 타임존을 Asia/Seoul 로 고정한다. 보는 사람의 시스템 타임존을 따르면
 * 해외 접속 시 모바일과 어긋나고, SSR 서버 TZ 가 KST 가 아닐 때
 * 서버 렌더 결과와 하이드레이션 결과가 달라진다.
 */
function fmtTime(ts: string | null): string {
  if (!ts) return "";
  const d = parseTimestamp(ts);
  if (!d) return "";
  return d.toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * KST 기준 "YYYY.MM.DD".
 * 시각과 마찬가지로 타임존을 고정해야 자정 근처 메시지가 보는 사람에 따라
 * 다른 날짜로 묶이지 않는다.
 */
function kstDate(d: Date): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}

/**
 * 날짜 구분 태그 문구. 앞 메시지와 같은 날이면 null(태그 없음).
 * 오늘이면 "오늘", 그 외에는 "2026.07.20".
 */
function dayDividerLabel(
  ts: string | null,
  prevTs: string | null,
): string | null {
  if (!ts) return null;
  const d = parseTimestamp(ts);
  if (!d) return null;

  const date = kstDate(d);

  if (prevTs) {
    const prev = parseTimestamp(prevTs);
    if (prev && kstDate(prev) === date) return null;
  }

  return date === kstDate(new Date()) ? "오늘" : date;
}

interface ChatRoomProps {
  /**
   * 메시지 조회 + STOMP 구독/발행 대상 방 id. 지금은 **스레드 방 id** 다.
   *
   * 서버는 발행한 destination 을 그대로 `@SendTo` 로 되돌리고(fan-out 없음),
   * 운영 중인 모바일 앱이 아직 스레드 방 토픽에 구독 중이다. 컨테이너 방으로
   * 옮기면 저장은 합쳐지지만 실시간만 앱과 갈라진다 — 그래서 스레드 방을 쓴다.
   * (백엔드가 두 토픽 동시 브로드캐스트를 넣으면 그때 컨테이너로 전환)
   */
  roomId: number;
  /** 조회 필터. 컨테이너 방으로 조회할 때만 지정한다. */
  threadId?: number | null;
  /**
   * 발행 payload 의 `opinionType` — 선택된 스레드에서의 내 투표.
   * 서버가 판정하지 않고 클라이언트 값을 그대로 저장하므로 반드시 실어보낸다.
   */
  myOpinion: string;
}

/**
 * 토론 주제(스레드) 하나의 대화. 과거 메시지는 REST(커서), 실시간 송수신은
 * STOMP over WebSocket(`@/lib/api/chatSocket`).
 *
 * 바깥 컬럼(`DebateRoom`)이 높이를 잡고, 여기서는 남는 높이를 채운다.
 * (반응 기능은 이번 범위 아님 — 숨김.)
 * 필드 값 형식(userCommunity/profileColor)은 방어적으로 렌더(로그인 응답 검증 후 조정).
 */
export default function ChatRoom({
  roomId,
  threadId,
  myOpinion,
}: ChatRoomProps) {
  const { accessToken, isLogin, _hasHydrated } = useAuthStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [socketStatus, setSocketStatus] =
    useState<ChatSocketStatus>("disconnected");
  const [draft, setDraft] = useState("");
  /** 발행 payload 에 필요한 값(소속 커뮤니티). 로드 전엔 전송 불가. */
  const [myCommunity, setMyCommunity] = useState<string | null>(null);
  const socketRef = useRef<ChatSocket | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  /** 과거 메시지 prepend 직전의 (scrollHeight - scrollTop). 복원용. */
  const restoreOffsetRef = useRef<number | null>(null);
  /** 사용자가 맨 아래를 보고 있는지 — 새 메시지 자동 스크롤 여부 판단 */
  const atBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);
  /** 최신 loadMore 를 observer 콜백에서 참조하기 위한 홀더 */
  const loadMoreRef = useRef<() => void>(() => {});
  /**
   * 중복 요청 차단. setLoadingMore 는 비동기라 같은 틱에 observer 가 두 번
   * 발화하면 둘 다 통과할 수 있어 동기 ref 로 막는다.
   */
  const loadingMoreRef = useRef(false);

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
        const [msgs, profile] = await Promise.all([
          fetchMessages(roomId, null, accessToken, threadId),
          // 전송 payload 용. 실패해도 읽기는 되어야 하므로 치명적으로 다루지 않는다.
          getMyProfile(accessToken).catch(() => null),
        ]);
        if (cancelled) return;
        if (profile) setMyCommunity(profile.community?.name ?? null);
        setMessages(toAscending(msgs.items));
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
  }, [_hasHydrated, isLogin, accessToken, roomId, threadId, retryKey]);

  // ── 실시간 소켓 (구독 + 전송) ─────────────────────
  useEffect(() => {
    if (!_hasHydrated || !isLogin || !accessToken) return;

    const socket = createChatSocket({
      roomId,
      token: accessToken,
      onStatus: setSocketStatus,
      onMessage: (msg) =>
        setMessages((prev) => {
          // 브로커 echo 로 내가 보낸 메시지가 되돌아올 수 있어 id 로 중복 제거.
          // id 가 없는 프레임은 서로 구분할 수 없으므로 dedup 하지 않는다
          // (하면 id 가 전부 null/undefined 로 같아져 두 번째부터 삼켜진다).
          const dup =
            typeof msg.id === "number" && prev.some((m) => m.id === msg.id);
          return dup ? prev : [...prev, msg];
        }),
    });
    socketRef.current = socket;

    return () => {
      socketRef.current = null;
      void socket.close();
    };
  }, [_hasHydrated, isLogin, accessToken, roomId]);

  // payload 에 필요한 값이 모두 있을 때만 전송 가능.
  const canSend = socketStatus === "connected" && myCommunity !== null;

  const send = () => {
    const content = draft.trim();
    // 서버 제약: 1자 이상 500자 이하 (Swagger ChatMessageResponse.content)
    if (!content || content.length > 500) return;
    if (myCommunity === null) return;
    const sent = socketRef.current?.publish({
      content,
      opinionType: myOpinion,
      userCommunity: myCommunity,
    });
    if (sent) setDraft("");
  };

  const loadMore = async () => {
    if (loadingMoreRef.current || !cursor) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    // prepend 후 보고 있던 위치를 유지하기 위해 바닥 기준 거리를 기억한다.
    const el = scrollRef.current;
    restoreOffsetRef.current = el ? el.scrollHeight - el.scrollTop : null;
    try {
      const msgs = await fetchMessages(roomId, cursor, accessToken, threadId);
      // 이전(과거) 대화 → 위에 붙임.
      setMessages((prev) => [...toAscending(msgs.items), ...prev]);
      setCursor(msgs.nextCursor);
      setHasMore(msgs.hasMore);
    } catch {
      // 더보기 실패는 조용히 무시
      restoreOffsetRef.current = null;
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };
  loadMoreRef.current = loadMore;

  // ── 스크롤 위치 관리 ──────────────────────────────
  // prepend 면 위치 복원, 그 외에는 맨 아래를 보고 있을 때만 따라 내려간다.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const restore = restoreOffsetRef.current;
    if (restore !== null) {
      el.scrollTop = el.scrollHeight - restore;
      restoreOffsetRef.current = null;
      return;
    }

    if (!didInitialScrollRef.current) {
      el.scrollTop = el.scrollHeight;
      didInitialScrollRef.current = true;
      return;
    }

    if (atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // ── 위로 스크롤하면 이전 대화 자동 로드 ─────────────
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreRef.current();
      },
      { root, rootMargin: "120px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  if (!_hasHydrated || loading) return <ChatSkeleton />;

  if (!isLogin) {
    return (
      // 대화는 인증이 필요하다(메시지 조회가 401). 탭·찬반 현황은 바깥에서
      // 비로그인도 볼 수 있으므로 여기만 로그인 안내로 대체한다.
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <p className="text-body-16 font-medium text-text-primary">
          로그인 후 대화에 참여할 수 있어요.
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
    // 바깥 컬럼이 잡아준 높이 안에서 남는 공간을 채운다. 입력창은 아래에 고정되고
    // 메시지 목록만 스크롤한다. min-h-0 이 없으면 flex 자식이 내용 높이만큼
    // 늘어나 스크롤 영역이 생기지 않는다.
    <div className="flex min-h-0 flex-1 flex-col">
      {error && (
        <div className="flex flex-shrink-0 flex-col items-center gap-3 py-10">
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

      {/* 메시지 목록 (유일한 스크롤 영역, 과거 → 최신 순) */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          // 24px 여유 — 정확히 바닥이 아니어도 "따라 내려가기" 유지
          atBottomRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        className="flex flex-1 flex-col gap-3 overflow-y-auto py-3"
      >
        {/* 상단 감지점 — 화면에 들어오면 이전 대화 자동 로드 */}
        <div ref={topSentinelRef} className="h-px flex-shrink-0" />

        {hasMore && (
          <p className="py-1 text-center text-caption-12 text-text-secondary">
            {loadingMore ? "이전 대화를 불러오는 중…" : ""}
          </p>
        )}

        {!error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-body-14 text-text-secondary">
              아직 대화가 없어요. 첫 메시지를 남겨보세요.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          // id 가 없는 프레임(소켓 echo)도 있어 인덱스로 폴백.
          const key = typeof msg.id === "number" ? `m${msg.id}` : `i${i}`;
          const divider = dayDividerLabel(
            msg.timeStamp,
            i > 0 ? messages[i - 1].timeStamp : null,
          );
          return (
            <Fragment key={key}>
              {divider && <DayDivider label={divider} />}
              {msg.messageType === "CHAT" ? (
                <MessageRow msg={msg} />
              ) : (
                <SystemRow msg={msg} />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* 입력 (하단 고정) */}
      <div className="flex-shrink-0">
        {socketStatus === "unauthorized" ? (
          <p className="pt-2 pb-3 text-center text-caption-12 text-text-secondary">
            세션이 만료되어 채팅에 연결할 수 없어요. 다시 로그인해 주세요.
          </p>
        ) : (
          socketStatus !== "connected" && (
            <p className="pt-2 pb-2 text-center text-caption-12 text-text-secondary">
              {socketStatus === "connecting"
                ? "채팅 서버에 연결 중이에요…"
                : socketStatus === "unreachable"
                  ? "채팅 서버에 연결할 수 없어요. 계속 시도하고 있어요…"
                  : "연결이 끊겼어요. 다시 연결하는 중이에요…"}
            </p>
          )
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-4"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            disabled={!canSend}
            placeholder={
              socketStatus !== "connected"
                ? "연결을 기다리는 중이에요"
                : canSend
                  ? "메시지를 입력하세요"
                  : "프로필 정보를 불러오는 중이에요"
            }
            className="flex-1 bg-transparent text-body-14 text-text-primary outline-none placeholder:text-text-secondary disabled:text-text-secondary"
          />
          <button
            type="submit"
            aria-label="전송"
            disabled={!canSend || !draft.trim()}
            className="text-brand transition-opacity hover:opacity-80 disabled:text-text-secondary disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <SendHorizontal size={18} />
          </button>
        </form>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

// ── 날짜 구분 태그 ────────────────────────────────
function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex flex-shrink-0 justify-center py-1">
      <span className="rounded-full bg-surface-elevated px-3 py-1 text-caption-12 text-text-secondary">
        {label}
      </span>
    </div>
  );
}

// ── 일반 메시지 ───────────────────────────────────
function MessageRow({ msg }: { msg: ChatMessage }) {
  const color = imageColorFromEngName(msg.profileColor ?? "");
  // 소켓 echo 프레임은 sender 가 비어 오는 경우가 있다.
  const sender = msg.sender?.trim() ? msg.sender : "알 수 없음";
  // 반대 입장은 우측 정렬. 찬성/중립/미상은 좌측(기본).
  const isDisagree = msg.opinionType === "DISAGREE";
  // 위치만으로는 한쪽 입장만 연속으로 보일 때 구분이 안 되므로 말풍선을 틴트한다.
  // *-dark 는 *-dark-on-grey 보다 어두운 단계라 본문(#EBE7ED) 대비가 더 확보된다.
  const bubbleBg =
    msg.opinionType === "AGREE"
      ? "bg-red-dark"
      : isDisagree
        ? "bg-blue-dark"
        : "bg-surface-elevated";

  return (
    // flex-shrink-0: 스크롤 컬럼 안에서 말풍선이 눌리지 않도록
    // flex-row-reverse: 아바타를 우측으로 보내되 메타 행의 내부 순서
    // (커뮤니티 → 닉네임 → 시간)는 그대로 유지된다.
    <div
      className={`flex flex-shrink-0 gap-2.5 ${isDisagree ? "flex-row-reverse" : ""}`}
    >
      {/* 아바타 */}
      <div
        className={`${color.bgClass} flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-caption-12 font-bold text-white`}
      >
        {sender.slice(0, 1)}
      </div>

      <div
        className={`flex min-w-0 flex-1 flex-col ${isDisagree ? "items-end" : "items-start"}`}
      >
        {/* 상단: 커뮤니티 + 닉네임 + 시간 */}
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
            {sender}
          </span>
          <span className="text-caption-12 text-text-secondary">
            {fmtTime(msg.timeStamp)}
          </span>
        </div>

        {/* 본문 */}
        <div
          className={`w-fit max-w-full rounded-2xl px-3.5 py-2.5 ${bubbleBg} ${
            isDisagree ? "rounded-tr-md" : "rounded-tl-md"
          }`}
        >
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
  const who = msg.sender?.trim() ? msg.sender : "누군가";
  const text =
    msg.messageType === "JOIN"
      ? `${who}님이 입장했어요`
      : msg.messageType === "LEAVE"
        ? `${who}님이 나갔어요`
        : msg.content;
  return (
    <p className="flex-shrink-0 py-1 text-center text-caption-12 text-text-secondary">
      {text}
    </p>
  );
}

// ── Skeleton ──────────────────────────────────────
function ChatSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 py-3">
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
