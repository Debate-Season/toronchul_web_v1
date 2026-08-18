"use client";

import { useEffect, useRef } from "react";
import useAuthStore from "@/store/useAuthStore";
import {
  initAnalytics,
  identifyUser,
  resetUser,
} from "@/lib/analytics/client";

/**
 * 계측 부트스트랩. 화면에 아무것도 그리지 않고 **초기화와 식별만** 담당한다.
 *
 * 컨텍스트 프로바이더가 아니다 — 지금은 피처 플래그 훅을 쓰지 않아
 * `PostHogProvider` 가 필요 없다. 플래그를 도입할 때 여기에 감싸면 된다.
 *
 * 페이지뷰는 여기서 다루지 않는다. SDK 의 `capture_pageview: 'history_change'`
 * 가 App Router 의 pushState/replaceState 내비게이션을 그대로 잡는다
 * (v0.8.0 PRD §3.1).
 */
export default function Analytics() {
  const { accessToken, isLogin, _hasHydrated } = useAuthStore();

  /** 직전 렌더에서 로그인 상태였는지. 로그아웃 "전환"에서만 reset 하기 위함. */
  const wasLoginRef = useRef(false);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    // 불문율 #4 — 하이드레이션 전에는 토큰이 아직 없다. 여기서 식별하면
    // 로그인 사용자가 익명으로 기록된다.
    if (!_hasHydrated) return;

    if (isLogin) {
      identifyUser(accessToken);
      wasLoginRef.current = true;
      return;
    }

    // 로그인 → 로그아웃 전환에서만 끊는다. 매번 부르면 익명 방문자의
    // distinct ID 가 렌더마다 새로 발급돼 한 사람이 여러 명으로 세어진다.
    if (wasLoginRef.current) {
      resetUser();
      wasLoginRef.current = false;
    }
  }, [_hasHydrated, isLogin, accessToken]);

  return null;
}
