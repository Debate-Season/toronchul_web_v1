"use client";

import ProfileImagePicker from "@/components/profile/ProfileImagePicker";
import { PROFILE_TEXT } from "@/lib/profile/constants";

/** 신규 가입 온보딩 — 프로필 이미지(색상) 선택. 완료 시 홈으로. */
export default function OnboardingImagePage() {
  return (
    <div className="py-4">
      <header className="px-5 pb-2">
        <h1 className="text-header-20 font-bold text-text-primary">
          {PROFILE_TEXT.imageCreateAppBar}
        </h1>
      </header>

      <div className="px-5 py-4">
        <ProfileImagePicker onboarding />
      </div>
    </div>
  );
}
