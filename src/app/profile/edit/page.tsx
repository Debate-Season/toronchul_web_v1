import ProfileEditContent from "@/components/profile/ProfileEditContent";
import ProfilePageShell from "@/components/profile/ProfilePageShell";

/** /profile/edit 직접 진입 폴백. 소프트 내비게이션은 @modal 이 인터셉트. */
export default function ProfileEditPage() {
  return (
    <ProfilePageShell>
      <ProfileEditContent />
    </ProfilePageShell>
  );
}
