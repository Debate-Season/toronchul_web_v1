/**
 * 이벤트 명세. **이름은 한 번 흩뿌리면 되돌리기 어렵다** — 여기서만 정의한다.
 *
 * 판별 유니온이라 `name` 을 고르면 `props` 가 함께 좁혀진다. 오타난 이름이나
 * 빠진 속성은 컴파일에서 걸린다(불문율 #3 의 취지).
 *
 * 속성명은 PostHog 관례대로 snake_case. `$pageview` 는 SDK 가 자동 수집하므로
 * 여기 없다.
 *
 * 설계 근거: `docs/prd/v0.8.0_posthog.md` §5
 */

export type LoginProvider = "kakao" | "apple";

/** 찬반 투표 값. `@/lib/api/room` 의 `VoteOpinion` 과 같은 값이지만
 *  분석 명세가 API 타입 변경에 끌려다니지 않도록 여기서 따로 좁힌다. */
export type VoteOpinionName = "AGREE" | "DISAGREE";

export type AnalyticsEvent =
  /** 이슈 상세 진입 */
  | { name: "issue_viewed"; props: { issue_id: number } }
  /** 토론방에서 특정 주제(스레드)가 열림. 탭 전환 포함 */
  | { name: "thread_opened"; props: { issue_id: number; thread_id: number } }
  /** 찬반 투표 확정. `changed` 는 입장 변경 여부 */
  | {
      name: "vote_cast";
      props: {
        thread_id: number;
        opinion: VoteOpinionName;
        changed: boolean;
      };
    }
  /** 메시지 발행 시도(소켓 publish 성공). 본문은 절대 싣지 않는다 — 길이만 */
  | {
      name: "message_sent";
      props: { thread_id: number; opinion: string; length: number };
    }
  /** 서버가 발행을 거절함. `e2911a1` 이전에는 조용히 묻히던 실패 */
  | { name: "message_rejected"; props: { thread_id: number } }
  /** 로그인 버튼을 눌러 OAuth 로 떠남 */
  | { name: "login_started"; props: { provider: LoginProvider } }
  /** 콜백에서 토큰 발급 성공 */
  | {
      name: "login_succeeded";
      props: { provider: LoginProvider; is_new_user: boolean };
    }
  /** 콜백 실패. `reason` 은 서버/SDK 문구가 아니라 우리가 정한 짧은 분류 */
  | {
      name: "login_failed";
      props: { provider: LoginProvider; reason: string };
    };

/** 이벤트 이름만 뽑은 유니온. 대시보드 문서화·테스트용. */
export type AnalyticsEventName = AnalyticsEvent["name"];
