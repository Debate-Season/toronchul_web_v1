import { apiFetch } from "@/lib/api/client";

// ── Types (Swagger ChatMessageResponse) ───────────
export type ChatMessageType = "CHAT" | "JOIN" | "LEAVE" | "ERROR";
export type ChatOpinionType = "AGREE" | "DISAGREE" | "NEUTRAL";

export interface ChatReaction {
  logicCount: number;
  attitudeCount: number;
  userReactedLogic: boolean;
  userReactedAttitude: boolean;
}

/**
 * Swagger 상 `content` 만 required 이고 나머지는 optional 이다.
 * 실제로 STOMP 브로드캐스트 프레임에서 `sender: null` 이 관측됐다(전송 직후 echo).
 * REST 조회 응답과 소켓 프레임이 같은 타입을 공유하므로, 서버가 채우지 않을 수
 * 있는 필드는 nullable 로 두고 렌더에서 방어한다.
 */
export interface ChatMessage {
  id: number;
  /** 컨테이너 방 id (Swagger: "룸ID(컨테이너)"). */
  roomId: number;
  /** 스레드(토론 주제) id. Swagger: "웹이 탭 필터에 사용. 미분류 메시지는 null". */
  threadId: number | null;
  /**
   * 작성자 user_id. JWT 의 `sub` 와 비교해 "내 메시지"를 판별한다
   * (`userIdFromToken`). `sub` 는 문자열, 이 값은 숫자라 변환이 필요하다.
   *
   * **WebSocket 인증 게이트 이전 메시지는 null 이다**(운영 기준 381건).
   * 판별할 방법이 없으므로 남의 메시지로 취급한다 — null 을 내 것으로 다루면
   * 과거 대화 전체가 내 메시지로 칠해진다.
   */
  userId: number | null;
  messageType: ChatMessageType;
  content: string;
  sender: string | null;
  opinionType: ChatOpinionType | null;
  /** 소속 커뮤니티(Swagger 예시는 이름 "에펨코리아", 경로로 오는 경우도 방어). */
  userCommunity: string | null;
  /** 프로필 색상 engName (예 "RED"). */
  profileColor: string | null;
  timeStamp: string | null;
  reactions: ChatReaction | null;
}

export interface ChatMessagesResponse {
  items: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
  totalCount: number;
}

export type ReactionType = "LOGIC" | "ATTITUDE";
export type ReactionAction = "ADD" | "REMOVE";

// ── API ───────────────────────────────────────────

/**
 * GET /api/v1/chat/rooms/{roomId}/messages — 메시지 조회(커서 페이지네이션). 인증 필요.
 *
 * `threadId` 를 주면 그 스레드(토론 주제)의 메시지만 내려온다. 커서는 **모드별로
 * 다른 스트림**이라 전체 ↔ 스레드 필터를 오갈 때 재사용하면 안 된다(실측 확인).
 */
export async function fetchMessages(
  roomId: number,
  cursor: string | null,
  token: string | null,
  threadId?: number | null,
): Promise<ChatMessagesResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (threadId != null) params.set("threadId", String(threadId));
  const q = params.size > 0 ? `?${params.toString()}` : "";
  return apiFetch<ChatMessagesResponse>(
    `/api/v1/chat/rooms/${roomId}/messages${q}`,
    { token },
  );
}

/** POST /api/v1/chat/messages/{messageId}/reactions — 논리/태도 반응 토글. */
export async function reactToMessage(
  messageId: number,
  reactionType: ReactionType,
  action: ReactionAction,
  token: string | null,
): Promise<void> {
  await apiFetch<unknown>(`/api/v1/chat/messages/${messageId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ reactionType, action }),
    token,
  });
}
