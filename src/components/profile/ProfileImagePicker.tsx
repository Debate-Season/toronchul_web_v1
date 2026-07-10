"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { updateProfileImage } from "@/lib/api/profile";
import DeButtonLarge from "@/components/TDS/DeButtonLarge";
import {
  IMAGE_COLORS,
  PROFILE_TEXT,
  imageColorFromEngName,
} from "@/lib/profile/constants";

interface ProfileImagePickerProps {
  /** 신규 가입(온보딩) 모드 여부. 완료 시 온보딩은 홈, 수정은 프로필로 이동. */
  onboarding: boolean;
  /** 수정 모드에서 현재 색상(engName). 온보딩은 null → 랜덤 지정. */
  initialColor?: string | null;
}

/** 프로필 이미지(색상) 선택 UI. 온보딩(전체화면)과 수정(다이얼로그)이 공용. */
export default function ProfileImagePicker({
  onboarding,
  initialColor = null,
}: ProfileImagePickerProps) {
  const router = useRouter();
  const { accessToken, isLogin, _hasHydrated } = useAuthStore();

  const [selected, setSelected] = useState<string>(
    initialColor
      ? imageColorFromEngName(initialColor).engName
      : IMAGE_COLORS[0].engName,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 온보딩(신규)일 때만 랜덤 색상 (SSR 하이드레이션 불일치 방지 위해 effect 에서)
  useEffect(() => {
    let cancelled = false;
    async function pickRandom() {
      if (onboarding && !initialColor) {
        const idx = Math.floor(Math.random() * IMAGE_COLORS.length);
        if (!cancelled) setSelected(IMAGE_COLORS[idx].engName);
      }
    }
    pickRandom();
    return () => {
      cancelled = true;
    };
  }, [onboarding, initialColor]);

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
      router.replace(onboarding ? "/" : "/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-2">
      {/* 미리보기 */}
      <div className="flex justify-center">
        <div className={`${selectedColor.bgClass} h-32 w-32 rounded-full`} />
      </div>

      {/* 색상 목록 */}
      <div>
        <p className="mb-3 text-body-14 font-semibold text-text-primary">색상</p>
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
          text={onboarding ? PROFILE_TEXT.startBtn : PROFILE_TEXT.modifyBtn}
          enable={!submitting}
          onPressed={handleSubmit}
        />
      </div>
    </div>
  );
}
