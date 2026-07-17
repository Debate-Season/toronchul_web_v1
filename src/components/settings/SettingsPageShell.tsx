"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { settingsRouteTitle } from "@/lib/settings/menu";

/**
 * 설정 계열 경로의 "직접 진입(새로고침/딥링크)" 폴백용 전체 페이지 셸.
 * 모달이 아니라 일반 페이지로 렌더한다 — 인터셉트 모달(@modal)과 셸이 겹쳐
 * 이중 모달이 되는 것을 방지. 소프트 내비게이션은 @modal 이 담당.
 */
export default function SettingsPageShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const title = settingsRouteTitle(pathname);

  return (
    <div className="py-2">
      <h1 className="mb-4 text-header-20 font-bold text-text-primary">{title}</h1>
      {children}
    </div>
  );
}
