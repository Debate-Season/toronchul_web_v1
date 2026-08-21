import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import type { ChatMessage } from "@/lib/api/chat";
import type { VoteOpinion } from "@/lib/api/room";

// ── 실측 확인 사항 (프로브: wss 핸드셰이크 + CONNECT 프레임) ──
// - 엔드포인트는 raw WebSocket. SockJS 폴백 불필요 (101 업그레이드 확인).
// - 인증은 STOMP CONNECT 단계. 헤더명은 **대문자 `Authorization`** 만 인식한다.
//   (소문자 `authorization`, `token`, `accessToken`, `?token=` 쿼리는 모두
//    "인증 토큰이 필요합니다"로 거절 → 서버가 읽지 않음.)
// - 토큰 누락: ERROR "WebSocket 연결에는 인증 토큰이 필요합니다." 후 close 1002.
// - 토큰 무효: ERROR "유효하지 않은 인증 토큰입니다." 후 close 1002.

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "wss://api.toronchul.app/prod/ws-stomp";

/** 구독(수신) 목적지 */
const topicOf = (roomId: number) => `/topic/room${roomId}`;
/** 발행(전송) 목적지 */
const publishOf = (roomId: number) => `/stomp/chat.room.${roomId}`;
/**
 * 발행 거절 통보 목적지. 서버가 `@SendToUser("/queue/errors")` 로 보내고
 * user destination prefix 가 `/user` 라 클라이언트는 이 경로를 구독한다.
 *
 * 여기를 구독하지 않으면 서버가 메시지를 거절해도 클라이언트는 아무 신호도
 * 받지 못한다 — 연결은 살아 있고 전송 프레임도 나갔으니 사용자 입장에서는
 * "보냈는데 아무 일도 안 일어남" 이 된다.
 *
 * 실제로 오는 것: 길이 검증 위반(1~500자), `NOT_FOUND_PROFILE`,
 * `NOT_FOUND_CHAT_ROOM`, 그 밖의 서버 예외.
 * **토큰 만료는 여기로 오지 않는다** — CONNECT 단계에서 거부되어 `unauthorized`
 * 상태로 잡힌다. 게다가 연결을 유지하는 동안에는 토큰이 만료돼도 발행이 계속
 * 성공한다(Principal 이 CONNECT 시점에 한 번만 세팅됨).
 *
 * 에러가 나도 서버는 세션을 닫지 않는다 — 재연결 루프는 생기지 않는다.
 */
const ERROR_QUEUE = "/user/queue/errors";

/** 발행 payload — 2026-07-18 백엔드 회신으로 확정된 스펙 */
export interface ChatPublishInput {
  content: string;
  /**
   * 이 스레드에서의 내 입장. **`AGREE` | `DISAGREE` 만 가능하다.**
   *
   * 입장을 고르지 않으면 채팅을 보낼 수 없는 것이 정책인데, 서버는 이 값을
   * 검증하지 않고 그대로 저장한다. 그래서 타입에서 `NEUTRAL`(미투표)을 아예
   * 없애 미투표 상태로 발행되는 경로를 막는다.
   */
  opinionType: VoteOpinion;
  /** 내 소속 커뮤니티 이름(MyProfile.community.name, 예 "에펨코리아") */
  userCommunity: string;
}

export type ChatSocketStatus =
  | "connecting"
  | "connected"
  /** 연결된 적 있으나 끊김 — 재연결 시도 중 */
  | "disconnected"
  /** 한 번도 연결에 성공하지 못함 (URL/네트워크/프록시 설정 의심) */
  | "unreachable"
  /** 인증 실패 — 재연결해도 소용없음 (토큰 갱신 또는 재로그인 필요) */
  | "unauthorized";

interface ChatSocketOptions {
  roomId: number;
  token: string;
  /** 브로커가 푸시한 메시지 1건 */
  onMessage: (msg: ChatMessage) => void;
  onStatus: (status: ChatSocketStatus) => void;
  /** 서버가 발행을 거절했을 때의 사용자 안내 문구 */
  onError: (message: string) => void;
}

export interface ChatSocket {
  /** 메시지 전송. 연결 전이면 false 를 반환하고 아무것도 보내지 않는다. */
  publish: (input: ChatPublishInput) => boolean;
  /** 구독 해제 + 연결 종료 */
  close: () => Promise<void>;
}

/** ERROR 프레임 message 헤더로 인증 실패 여부 판별 */
function isAuthError(message: string | undefined): boolean {
  if (!message) return false;
  return message.includes("인증 토큰") || message.includes("유효하지 않은");
}

/** 서버 문구를 읽지 못했을 때의 대체 안내. */
const GENERIC_SEND_ERROR = "메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.";

/**
 * 발행 거절 프레임 → 사용자 안내 문구.
 *
 * `ChatMessageErrorResponse` 는 `{ messageType: "ERROR", message: string }`
 * 두 필드뿐이다(2026-08-16 백엔드 확인). REST 의 `ErrorResponse` 와 달리
 * **`code` 도 `status` 도 없어서 에러 종류를 구분할 수 없다.** 그래서 종류별
 * 분기 없이 서버 문구를 그대로 보여준다 — 문구는 서버에서 바뀔 수 있으므로
 * 문자열 매칭으로 분기하지 말 것.
 *
 * 원본 메시지를 식별할 값(clientMessageId 류)도 없다. 그래서 실패를 말풍선
 * 단위로 표시할 수 없고 화면 하단 배너로 처리한다.
 *
 * 두 필드 모두 nullable 이라 방어적으로 읽는다.
 */
function parseErrorFrame(body: string): string {
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed !== "object" || parsed === null) return GENERIC_SEND_ERROR;
    const message = (parsed as Record<string, unknown>).message;
    return typeof message === "string" && message.trim()
      ? message.trim()
      : GENERIC_SEND_ERROR;
  } catch {
    return GENERIC_SEND_ERROR;
  }
}

/**
 * 브로커가 보내는 프레임은 ChatMessageResponse(JSON) 형태로 가정하되,
 * 파싱 실패나 형태 불일치는 조용히 버린다(렌더 크래시 방지).
 */
function parseMessage(body: string): ChatMessage | null {
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as Partial<ChatMessage>;
    if (typeof candidate.content !== "string") return null;
    return candidate as ChatMessage;
  } catch {
    return null;
  }
}

/**
 * 토론방 채팅 소켓. 구독은 연결 성공 시 자동, 재연결 시 재구독된다.
 *
 * ⚠️ 발행 payload 형식은 서버 스펙 미확인 구간이다. REST Swagger 에는 STOMP
 * `@MessageMapping` DTO 가 노출되지 않고, 유효 토큰 없이는 CONNECT 가 막혀
 * 실측이 불가능했다. 아래 `buildPayload` 는 `ChatMessageResponse` 를 뒤집은
 * 최소 형태(추정)이며, 로그인 세션으로 검증 후 이 함수만 고치면 된다.
 */
export function createChatSocket({
  roomId,
  token,
  onMessage,
  onStatus,
  onError,
}: ChatSocketOptions): ChatSocket {
  let subscription: StompSubscription | null = null;
  let errorSubscription: StompSubscription | null = null;
  let authFailed = false;
  let everConnected = false;

  const client = new Client({
    brokerURL: WS_URL,
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 3000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
  });

  client.onConnect = () => {
    everConnected = true;
    onStatus("connected");
    subscription = client.subscribe(topicOf(roomId), (frame: IMessage) => {
      const msg = parseMessage(frame.body);
      if (msg) onMessage(msg);
    });
    // 발행 거절 통보. 재연결마다 다시 구독된다(onConnect 안이라서).
    errorSubscription = client.subscribe(ERROR_QUEUE, (frame: IMessage) => {
      onError(parseErrorFrame(frame.body));
    });
  };

  client.onStompError = (frame) => {
    if (isAuthError(frame.headers["message"])) {
      // 인증 실패는 재연결 루프를 돌아도 동일하게 실패한다 → 중단.
      authFailed = true;
      client.deactivate();
      onStatus("unauthorized");
    }
  };

  client.onWebSocketClose = (evt) => {
    if (authFailed) return;
    if (everConnected) {
      onStatus("disconnected");
      return;
    }
    // 한 번도 붙지 못한 경우는 설정 문제일 가능성이 높다(잘못된 호스트는
    // 업그레이드 단계에서 HTTP 400 으로 끊긴다). 원인 추적용 로그를 남긴다.
    console.warn(
      `[chatSocket] 연결 실패 — url=${WS_URL} code=${evt?.code ?? "?"}`,
    );
    onStatus("unreachable");
  };

  onStatus("connecting");
  client.activate();

  return {
    publish(input: ChatPublishInput): boolean {
      if (!client.connected) return false;
      client.publish({
        destination: publishOf(roomId),
        body: buildPayload(roomId, input),
      });
      return true;
    },
    async close() {
      subscription?.unsubscribe();
      subscription = null;
      errorSubscription?.unsubscribe();
      errorSubscription = null;
      await client.deactivate();
    },
  };
}

/**
 * 발행 payload — 2026-07-18 백엔드 회신으로 확정.
 *
 * `sender` 는 **보내지 않는다**. 과거 스펙에서는 클라이언트가 보낸 값을 그대로
 * 저장해 남의 닉네임으로 사칭이 가능했고(그 구멍이 `sender: null` 로 드러난 것이
 * 이번 건), 지금은 서버가 JWT → 프로필 닉네임으로 채운다. 보내도 무시·덮어쓰기.
 *
 * `opinionType`/`userCommunity` 는 아직 클라이언트 값을 사용한다.
 */
function buildPayload(roomId: number, input: ChatPublishInput): string {
  return JSON.stringify({
    roomId,
    messageType: "CHAT",
    content: input.content,
    opinionType: input.opinionType,
    userCommunity: input.userCommunity,
  });
}
