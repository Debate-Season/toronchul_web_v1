"use client";

import ProfileContent from "@/components/profile/ProfileContent";
import ProfileRouteDialog from "@/components/profile/ProfileRouteDialog";

/** /profile 은 프로필 메인을 다이얼로그로 노출한다. */
export default function ProfilePage() {
  return (
    <ProfileRouteDialog title="프로필">
      <ProfileContent showHeading={false} />
    </ProfileRouteDialog>
  );
}
