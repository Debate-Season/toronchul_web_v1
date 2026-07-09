"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import DeModalSheet from "@/components/TDS/DeModalSheet";

interface ProfileRouteDialogProps {
  title: string;
  children: ReactNode;
}

/**
 * 프로필 계열 라우트(/profile, /profile/edit 등)를 다이얼로그로 노출하는 셸.
 * 닫기(backdrop/X)는 이전 페이지로 돌아간다(히스토리 없으면 홈).
 */
export default function ProfileRouteDialog({
  title,
  children,
}: ProfileRouteDialogProps) {
  const router = useRouter();

  const onClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <DeModalSheet title={title} onClose={onClose}>
      {children}
    </DeModalSheet>
  );
}
