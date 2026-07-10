import ProfileTermsContent from "@/components/profile/ProfileTermsContent";
import ProfilePageShell from "@/components/profile/ProfilePageShell";

/** /profile/terms 직접 진입 폴백. 소프트 내비게이션은 @modal 이 인터셉트. */
export default function ProfileTermsPage() {
  return (
    <ProfilePageShell>
      <ProfileTermsContent />
    </ProfilePageShell>
  );
}
