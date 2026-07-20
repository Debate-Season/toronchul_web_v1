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
  roomId: number;
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

/** GET /api/v1/chat/rooms/{roomId}/messages — 메시지 조회(커서 페이지네이션). 인증 필요. */
export async function fetchMessages(
  roomId: number,
  cursor: string | null,
  token: string | null,
): Promise<ChatMessagesResponse> {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
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
