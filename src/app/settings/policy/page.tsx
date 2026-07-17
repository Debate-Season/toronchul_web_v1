import SettingsPolicyContent from "@/components/settings/SettingsPolicyContent";
import SettingsPageShell from "@/components/settings/SettingsPageShell";

/** /settings/policy 직접 진입 폴백. 소프트 내비게이션은 @modal 이 인터셉트. */
export default function SettingsPolicyPage() {
  return (
    <SettingsPageShell>
      <SettingsPolicyContent />
    </SettingsPageShell>
  );
}
