// ── 설정 모달 메뉴 ────────────────────────────────────────
// 각 메뉴는 고유 URL(/settings/*). 소프트 내비게이션은 @modal 인터셉트로 모달 유지.
// 순서: 계정(첫번째) → 정책 → 문의(마지막).

export interface SettingsMenuItem {
  key: string;
  label: string;
  href: string;
  /** 이 메뉴를 활성으로 표시할 하위 경로들(드릴다운 화면 포함) */
  matchPrefixes: string[];
}

export const SETTINGS_MENU: readonly SettingsMenuItem[] = [
  {
    key: "account",
    label: "계정",
    href: "/settings/account",
    matchPrefixes: ["/settings/account/delete"],
  },
  {
    key: "policy",
    label: "정책",
    href: "/settings/policy",
    matchPrefixes: [],
  },
  {
    key: "support",
    label: "문의",
    href: "/settings/support",
    matchPrefixes: [],
  },
];

/** 현재 경로에서 활성 메뉴 key. 매칭 실패 시 "account". */
export function activeSettingsKey(pathname: string): string {
  for (const item of SETTINGS_MENU) {
    if (pathname === item.href) return item.key;
    if (
      item.matchPrefixes.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      )
    ) {
      return item.key;
    }
  }
  return "account";
}

// ── 경로별 타이틀(모달/페이지 셸 공용) ─────────────────────
const SETTINGS_ROUTE_TITLES: Record<string, string> = {
  "/settings/account": "계정",
  "/settings/policy": "정책",
  "/settings/support": "문의",
  "/settings/account/delete": "계정 삭제",
};

export function settingsRouteTitle(pathname: string): string {
  return SETTINGS_ROUTE_TITLES[pathname] ?? "설정";
}
