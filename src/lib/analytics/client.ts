"use client";

import posthog from "posthog-js";
import type { AnalyticsEvent } from "@/lib/analytics/events";
import { readIdentity } from "@/lib/analytics/identity";

/**
 * PostHog 래퍼. **컴포넌트는 `posthog` 를 직접 만지지 않는다** — 전부 이 파일을
 * 거친다(v0.8.0 PRD §4·§6).
 *
 * 그래야 ① 이벤트 이름이 타입으로 강제되고 ② 키가 없을 때 앱 전체가 조용히
 * no-op 이 되며 ③ 나중에 도구를 바꿔도 호출부를 안 건드린다.
 *
 * 수집 정책(PRD §2.2):
 * - **오토캡처 끔** — 클릭 하나가 이벤트라 채팅 화면에서 무료 티어를 태운다
 * - **세션 리플레이 끔** — 토론방 화면에 찬반 입장과 작성 중인 메시지가 노출된다
 * - **페이지뷰는 자동** — `defaults` 가 `capture_pageview: 'history_change'` 를
 *   켜므로 App Router 의 pushState/replaceState 내비게이션이 그대로 잡힌다.
 *   수동 훅이 필요 없다(PRD §3.1)
 */

/** 빌드 시 인라인되도록 반드시 전체 표현식으로 참조한다. */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/**
 * 수집 엔드포인트. `next.config.ts` 의 rewrite 로 우리 도메인을 거친다 —
 * 광고 차단기·ITP 회피. 리전은 서버 rewrite 쪽에서만 결정되므로 여기는 상대경로.
 */
const API_HOST = "/relay";

/** PostHog 앱 링크(툴바·리플레이 링크)가 가리킬 실제 호스트. */
const UI_HOST = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://us.posthog.com";

let initialized = false;

/** 키가 주입됐는지. 로컬·프리뷰에서 키 없이 돌리면 전부 no-op 이 된다. */
export function isAnalyticsEnabled(): boolean {
  return typeof KEY === "string" && KEY.length > 0;
}

/** 앱 최상단에서 한 번. 브라우저에서만 의미가 있다. */
export function initAnalytics(): void {
  if (initialized || !isAnalyticsEnabled() || typeof window === "undefined") {
    return;
  }
  initialized = true;

  posthog.init(KEY as string, {
    api_host: API_HOST,
    ui_host: UI_HOST,

    // 날짜별 기본값 묶음. '2026-01-30' 이상이어야 외부 스크립트가 head 에
    // 주입되어 SSR 하이드레이션 에러를 피한다. 최신('2026-08-29')은 오늘 이후
    // 날짜이고 우리가 안 쓰는 크로스 서브도메인 동작이라 한 단계 아래로 고정.
    defaults: "2026-06-25",

    // 우리가 정의한 이벤트만 본다(PRD §5).
    autocapture: false,
    capture_heatmaps: false,

    // §2.2 — 법적 검토 전까지 켜지 않는다.
    disable_session_recording: true,

    // 프론트 에러를 실명화하는 게 이번 도입의 1순위 목적 중 하나.
    capture_exceptions: true,

    // 익명 방문자는 person 프로필을 만들지 않는다(기본값이지만 의도를 명시).
    // identify 를 부르는 순간 익명 이벤트가 그 사람에게 이어붙는다.
    person_profiles: "identified_only",

    persistence: "localStorage+cookie",

    debug: process.env.NODE_ENV === "development",
  });
}

/**
 * 이벤트 전송. `event` 가 판별 유니온이라 이름과 속성이 함께 검사된다.
 *
 * ```ts
 * capture({ name: "vote_cast", props: { thread_id: 71, opinion: "AGREE", changed: false } });
 * ```
 */
export function capture(event: AnalyticsEvent): void {
  if (!initialized) return;
  posthog.capture(event.name, event.props);
}

/**
 * 로그인 사용자 식별. **`_hasHydrated` 이후에 부를 것**(불문율 #4) — 하이드레이션
 * 전에는 토큰이 아직 없어서 로그인 사용자를 익명으로 잘못 기록한다.
 *
 * 토큰에서 id 를 못 꺼내면(포맷 변경 등) 아무 것도 하지 않고 익명으로 남긴다.
 * 잘못된 id 로 사람을 합치는 것보다 익명이 낫다.
 */
export function identifyUser(accessToken: string | null): void {
  if (!initialized) return;

  const identity = readIdentity(accessToken);
  if (!identity) return;

  // 이미 같은 사람으로 식별돼 있으면 매 렌더마다 다시 부르지 않는다.
  if (posthog.get_distinct_id() === identity.distinctId) return;

  posthog.identify(
    identity.distinctId,
    identity.role ? { role: identity.role } : undefined,
  );
}

/**
 * 로그아웃. 다음 익명 세션이 방금 나간 사람에게 붙지 않도록 끊는다.
 * (공용 PC 에서 특히 중요하다.)
 */
export function resetUser(): void {
  if (!initialized) return;
  posthog.reset();
}
