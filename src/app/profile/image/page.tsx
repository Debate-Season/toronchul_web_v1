"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProfileRouteDialog from "@/components/profile/ProfileRouteDialog";
import ProfileImagePicker from "@/components/profile/ProfileImagePicker";
import { PROFILE_TEXT } from "@/lib/profile/constants";

/** 프로필 이미지 수정 — 다이얼로그. (신규 가입 이미지 선택은 /onboarding/image) */
export default function ProfileImagePage() {
  return (
    <Suspense fallback={<ImageSkeleton />}>
      <ProfileImageEdit />
    </Suspense>
  );
}

function ProfileImageEdit() {
  const searchParams = useSearchParams();
  const colorParam = searchParams.get("color");

  return (
    <ProfileRouteDialog title={PROFILE_TEXT.imageModifyAppBar}>
      <ProfileImagePicker onboarding={false} initialColor={colorParam} />
    </ProfileRouteDialog>
  );
}

function ImageSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 px-5 py-10">
      <div className="h-32 w-32 rounded-full bg-grey-90 animate-pulse" />
      <div className="h-20 w-full rounded-xl bg-grey-90 animate-pulse" />
    </div>
  );
}
