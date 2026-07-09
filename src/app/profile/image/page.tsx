"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { updateProfileImage } from "@/lib/api/profile";
import DeButtonLarge from "@/components/TDS/DeButtonLarge";
import ProfileRouteDialog from "@/components/profile/ProfileRouteDialog";
import {
  IMAGE_COLORS,
  PROFILE_TEXT,
  imageColorFromEngName,
} from "@/lib/profile/constants";

export default function ProfileImagePage() {
  return (
    <Suspense fallback={<ImageSkeleton />}>
      <ProfileImageContent />
    </Suspense>
  );
}

function ProfileImageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, isLogin, _hasHydrated } = useAuthStore();

  // onboarding=1 이면 신규(가입) 모드
  const isOnboarding = searchParams.get("onboarding") === "1";
  const colorParam = searchParams.get("color");

  const [selected, setSelected] = useState<string>(
    colorParam ? imageColorFromEngName(colorParam).engName : IMAGE_COLORS[0].engName,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 온보딩(신규)일 때만 랜덤 색상 (SSR 하이드레이션 불일치 방지 위해 effect 에서)
  useEffect(() => {
    let cancelled = false;
    async function pickRandom() {
      if (isOnboarding && !colorParam) {
        const idx = Math.floor(Math.random() * IMAGE_COLORS.length);
        if (!cancelled) setSelected(IMAGE_COLORS[idx].engName);
      }
    }
    pickRandom();
    return () => {
      cancelled = true;
    };
  }, [isOnboarding, colorParam]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isLogin) router.replace("/login");
  }, [_hasHydrated, isLogin, router]);

  const selectedColor = imageColorFromEngName(selected);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await updateProfileImage(selected, accessToken);
      router.replace(isOnboarding ? "/" : "/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setSubmitting(false);
    }
  };

  if (!_hasHydrated) return <ImageSkeleton />;

  const body = (
      <div className="flex flex-col gap-8 py-2">
        {/* 미리보기 */}
        <div className="flex justify-center">
          <div
            className={`${selectedColor.bgClass} h-32 w-32 rounded-full`}
          />
        </div>

        {/* 색상 목록 */}
        <div>
          <p className="mb-3 text-body-14 font-semibold text-text-primary">
            색상
          </p>
          <div className="flex flex-wrap gap-4">
            {IMAGE_COLORS.map((color) => {
              const isSel = selected === color.engName;
              return (
                <button
                  key={color.engName}
                  type="button"
                  onClick={() => setSelected(color.engName)}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <span
                    className={[
                      "flex items-center justify-center rounded-full transition-all",
                      isSel ? "ring-2 ring-brand p-0.5" : "ring-1 ring-border p-0.5",
                    ].join(" ")}
                  >
                    <span
                      className={`${color.bgClass} block h-10 w-10 rounded-full`}
                    />
                  </span>
                  <span
                    className={[
                      "text-caption-12",
                      isSel ? "text-text-primary" : "text-text-secondary",
                    ].join(" ")}
                  >
                    {color.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-caption-12 text-red">{error}</p>}

        <div className="pt-2">
          <DeButtonLarge
            text={isOnboarding ? PROFILE_TEXT.startBtn : PROFILE_TEXT.modifyBtn}
            enable={!submitting}
            onPressed={handleSubmit}
          />
        </div>
      </div>
  );

  // 온보딩(신규가입)은 전체 화면, 수정은 다이얼로그.
  if (isOnboarding) {
    return (
      <div className="px-5 py-4">
        <h1 className="mb-4 text-header-20 font-bold text-text-primary">
          {PROFILE_TEXT.imageCreateAppBar}
        </h1>
        {body}
      </div>
    );
  }

  return (
    <ProfileRouteDialog title={PROFILE_TEXT.imageModifyAppBar}>
      {body}
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
