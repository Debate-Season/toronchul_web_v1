"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import DeModalSheet from "@/components/TDS/DeModalSheet";
import { profileRouteTitle } from "@/lib/profile/routeTitle";

/**
 * 프로필 계열(/profile, /profile/edit ...) 공용 모달 셸.
 * 고정 크기(fixedHeight)로 화면 전환 시 크기가 바뀌지 않으며,
 * 타이틀은 현재 경로에서 파생. 닫기는 이전 화면으로.
 */
export default function ProfileModalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const title = profileRouteTitle(pathname);

  const onClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <DeModalSheet title={title} onClose={onClose} fixedHeight>
      {children}
    </DeModalSheet>
  );
}
