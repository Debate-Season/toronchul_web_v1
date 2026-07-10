import ProfileContent from "@/components/profile/ProfileContent";
import ProfilePageShell from "@/components/profile/ProfilePageShell";

/** /profile 직접 진입(새로고침/딥링크) 폴백. 소프트 내비게이션은 @modal 이 인터셉트. */
export default function ProfilePage() {
  return (
    <ProfilePageShell>
      <ProfileContent showHeading={false} />
    </ProfilePageShell>
  );
}
