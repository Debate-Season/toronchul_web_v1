import SettingsAccountDeleteContent from "@/components/settings/SettingsAccountDeleteContent";
import SettingsPageShell from "@/components/settings/SettingsPageShell";

/** /settings/account/delete 직접 진입 폴백. 소프트 내비게이션은 @modal 이 인터셉트. */
export default function SettingsAccountDeletePage() {
  return (
    <SettingsPageShell>
      <SettingsAccountDeleteContent />
    </SettingsPageShell>
  );
}
