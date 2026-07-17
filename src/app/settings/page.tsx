import { redirect } from "next/navigation";

/** /settings 직접 진입은 첫 메뉴(계정)로. */
export default function SettingsPage() {
  redirect("/settings/account");
}
