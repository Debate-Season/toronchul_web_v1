import type { ReactNode } from "react";
import SettingsModalShell from "@/components/settings/SettingsModalShell";

/**
 * 인터셉트된 /settings 계열의 공용 모달 셸.
 * /settings/account ↔ /settings/policy 등 소프트 내비게이션 시 이 레이아웃은 유지되고
 * 내부 콘텐츠만 교체되어, 하나의 고정 크기 모달에서 화면만 전환된다.
 */
export default function InterceptedSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SettingsModalShell>{children}</SettingsModalShell>;
}
