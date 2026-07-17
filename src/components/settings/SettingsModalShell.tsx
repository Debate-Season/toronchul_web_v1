"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import DeModalSheet from "@/components/TDS/DeModalSheet";
import SettingsNav from "@/components/settings/SettingsNav";
import { settingsRouteTitle } from "@/lib/settings/menu";

/**
 * 설정 계열(/settings/*) 공용 모달 셸.
 * 데스크톱은 좌측 메뉴 + 우측 콘텐츠, 모바일은 상단 가로 메뉴 + 하단 콘텐츠.
 * 고정 크기(fixedHeight)로 화면 전환 시 크기가 바뀌지 않는다.
 *
 * 닫기(X/backdrop/ESC)는 모달을 완전히 닫는다(직전 화면으로 복귀).
 * 모달 내부 이동(SettingsNav·각 링크)은 모두 replace 라 히스토리 항목이
 * 하나로 유지되므로 router.back() 한 번이면 항상 모달이 닫힌다.
 */
export default function SettingsModalShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const title = settingsRouteTitle(pathname);

  const onClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <DeModalSheet
      title={title}
      onClose={onClose}
      fixedHeight
      size="wide"
      bodyClassName="flex min-h-0 flex-1 flex-col sm:flex-row"
    >
      <SettingsNav />
      <div className="min-w-0 flex-1 overflow-y-auto px-5 py-2">{children}</div>
    </DeModalSheet>
  );
}
