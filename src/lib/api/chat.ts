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

export interface ChatMessage {
  id: number;
  roomId: number;
  messageType: ChatMessageType;
  content: string;
  sender: string;
  opinionType: ChatOpinionType;
  /** 소속 커뮤니티(아이콘 경로 또는 이름). 렌더는 방어적으로 처리. */
  userCommunity: string;
  /** 프로필 색상(engName 추정, 예 "RED"). */
  profileColor: string;
  timeStamp: string;
  reactions: ChatReaction;
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
