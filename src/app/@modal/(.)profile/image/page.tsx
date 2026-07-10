"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProfileImagePicker from "@/components/profile/ProfileImagePicker";

export default function InterceptedProfileImagePage() {
  return (
    <Suspense fallback={null}>
      <ImageContent />
    </Suspense>
  );
}

function ImageContent() {
  const searchParams = useSearchParams();
  const colorParam = searchParams.get("color");
  return <ProfileImagePicker onboarding={false} initialColor={colorParam} />;
}
