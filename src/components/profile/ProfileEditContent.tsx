"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { getMyProfile, type MyProfile } from "@/lib/api/profile";
import ProfileForm from "@/components/profile/ProfileForm";

/** 프로필 수정 콘텐츠. 프로필 모달/전체 페이지가 공용으로 사용. */
export default function ProfileEditContent() {
  const router = useRouter();
  const { accessToken, isLogin, _hasHydrated } = useAuthStore();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isLogin) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyProfile(accessToken);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "프로필을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [_hasHydrated, isLogin, accessToken, retryKey, router]);

  if (!_hasHydrated || loading) return <FormSkeleton />;

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-body-14 text-red">
          {error ?? "프로필을 불러오지 못했습니다."}
        </p>
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="rounded-lg border border-border px-4 py-2 text-body-14 text-text-secondary transition-colors hover:bg-grey-90 cursor-pointer"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <ProfileForm
      mode="modify"
      initial={profile}
      token={accessToken}
      onDone={() => router.push("/profile")}
    />
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-1 py-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-4 w-20 rounded bg-grey-90 animate-pulse" />
          <div className="h-12 w-full rounded-xl bg-grey-90 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
