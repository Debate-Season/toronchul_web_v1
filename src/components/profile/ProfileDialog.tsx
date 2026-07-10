"use client";

import DeModalSheet from "@/components/TDS/DeModalSheet";
import ProfileContent from "@/components/profile/ProfileContent";

/**
 * 프로필 다이얼로그(모달). 현재 페이지 위에 오버레이로 뜬다.
 * (라우트 이동 없이 홈/이슈맵/온보딩 등 어떤 화면에서든 그 화면 위에서 열림)
 */
export default function ProfileDialog({ onClose }: { onClose: () => void }) {
  return (
    <DeModalSheet title="프로필" onClose={onClose}>
      <ProfileContent showHeading={false} onNavigate={onClose} />
    </DeModalSheet>
  );
}
