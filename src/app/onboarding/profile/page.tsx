"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { PROFILE_TEXT } from "@/lib/profile/constants";
import ProfileForm from "@/components/profile/ProfileForm";

/** 신규 가입 온보딩 — 프로필 생성(POST). 완료 시 이미지(색상) 선택으로. */
export default function OnboardingProfilePage() {
  const router = useRouter();
  const { accessToken, isLogin, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isLogin) router.replace("/login");
  }, [_hasHydrated, isLogin, router]);

  if (!_hasHydrated || !isLogin) {
    return (
      <div className="flex flex-col gap-6 px-5 py-10">
        <div className="h-6 w-24 rounded bg-grey-90 animate-pulse" />
        <div className="h-12 w-full rounded-xl bg-grey-90 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="py-4">
      <header className="px-5 pb-2">
        <h1 className="text-header-20 font-bold text-text-primary">
          {PROFILE_TEXT.createAppBar}
        </h1>
      </header>

      <ProfileForm
        mode="create"
        initial={null}
        token={accessToken}
        onDone={() => router.replace("/profile/image?onboarding=1")}
      />
    </div>
  );
}
