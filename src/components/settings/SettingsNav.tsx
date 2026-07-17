"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SETTINGS_MENU, activeSettingsKey } from "@/lib/settings/menu";

/**
 * 설정 모달 메뉴. 각 항목은 고유 URL(/settings/*)로 이동한다.
 * - 데스크톱(sm+): 좌측 세로 사이드바
 * - 모바일: 모달 상단 가로 나열(가로 스크롤)
 *
 * 내부 이동은 replace 로 처리해 모달 히스토리 항목이 하나로 유지되고,
 * 그래야 셸의 닫기(X)가 항상 모달을 완전히 닫는다(직전 화면으로 복귀).
 */
export default function SettingsNav() {
  const pathname = usePathname();
  const active = activeSettingsKey(pathname);

  return (
    <nav
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-2 sm:w-44 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto sm:border-b-0 sm:border-r sm:p-3"
    >
      {SETTINGS_MENU.map((item) => {
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            replace
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-body-14 font-medium transition-colors ${
              isActive
                ? "bg-grey-90 text-brand"
                : "text-text-secondary hover:bg-grey-100 hover:text-text-primary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
