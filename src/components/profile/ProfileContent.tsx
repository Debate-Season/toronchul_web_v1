"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { performLogout } from "@/lib/auth/logout";
import { getMyProfile, type MyProfile } from "@/lib/api/profile";
import { imageUrl } from "@/lib/imageUrl";
import { regionLabel } from "@/lib/profile/regions";
import ProfileAvatar from "@/components/profile/ProfileAvatar";

interface ProfileContentProps {
  /** 최상단 "프로필" 헤딩 표시 (모달에서는 셸 타이틀이 있으므로 false) */
  showHeading?: boolean;
  /** 내부 라우트 이동 시 호출 (온보딩 다이얼로그 닫기 등) */
  onNavigate?: () => void;
}

/**
 * 프로필 메인 콘텐츠(프로필 pane). 아바타·닉네임·프로필 수정·소속 커뮤니티만 노출.
 * 문의/법적/계정 섹션은 좌측 메뉴의 별도 URL 로 분리, 로그아웃은 GNB 드롭다운으로 이동.
 * /profile 페이지·모달·온보딩 다이얼로그가 공용으로 사용.
 */
export default function ProfileContent({
  showHeading = true,
  onNavigate,
}: ProfileContentProps) {
  const router = useRouter();
  const { accessToken, isLogin, _hasHydrated } = useAuthStore();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!_hasHydrated || !isLogin) return;

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
  }, [_hasHydrated, isLogin, accessToken, retryKey]);

  const handleLogout = async () => {
    onNavigate?.();
    await performLogout();
    router.replace("/");
  };

  if (!_hasHydrated) return <ProfileSkeleton />;

  if (!isLogin) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-header-20 font-bold text-text-primary">프로필</p>
        <p className="text-body-14 text-text-secondary">
          로그인 후 이용할 수 있습니다.
        </p>
        <Link
          href="/login"
          onClick={onNavigate}
          className="rounded-lg bg-brand px-6 py-2.5 text-body-14 font-semibold text-white transition-colors hover:opacity-90"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  if (loading) return <ProfileSkeleton />;

  if (error || !profile) {
    // 프로필 미등록(온보딩 미완료) 계정: 재시도가 아니라 로그아웃 유도
    const noProfile = error?.includes("NOT_FOUND_PROFILE") ?? false;

    if (noProfile) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-body-16 font-medium text-text-primary">
            프로필 입력을 완료해주세요.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-body-14 text-text-secondary transition-colors hover:bg-grey-90 cursor-pointer"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      );
    }

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
    <div className="flex flex-col gap-10 py-2">
      {showHeading && (
        <h1 className="text-header-20 font-bold text-text-primary">프로필</h1>
      )}

      {/* 내 프로필 */}
      <section className="flex flex-col items-center gap-4">
        <Link
          href={`/profile/image?color=${encodeURIComponent(profile.profileImage)}`}
          onClick={onNavigate}
        >
          <ProfileAvatar engName={profile.profileImage} size={80} editable />
        </Link>
        <p className="text-header-28 font-semibold text-text-primary">
          {profile.nickname}
        </p>
        <Link
          href="/profile/edit"
          onClick={onNavigate}
          className="rounded-full bg-grey-80 px-4 py-1.5 text-body-14 font-medium text-text-primary transition-colors hover:bg-grey-70"
        >
          프로필 수정
        </Link>
      </section>

      {/* 내 소속 커뮤니티 */}
      <section>
        <h2 className="mb-3 text-header-18 font-semibold text-text-primary">
          내 소속 커뮤니티
        </h2>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(profile.community.iconUrl)}
            alt={profile.community.name}
            width={44}
            height={44}
            className="rounded-xl object-cover"
            style={{ width: 44, height: 44 }}
          />
          <span className="text-body-16 font-semibold text-text-primary">
            {profile.community.name}
          </span>
        </div>
      </section>

      {/* 내 정보 (읽기 전용) */}
      <section>
        <h2 className="mb-1 text-header-18 font-semibold text-text-primary">
          내 정보
        </h2>
        <InfoRow label="성별" value={profile.gender} />
        <InfoRow label="연령대" value={profile.ageRange} />
        <InfoRow
          label="거주지"
          value={regionLabel(
            profile.residenceProvince,
            profile.residenceDistrict,
          )}
        />
        <InfoRow
          label="출신지"
          value={regionLabel(
            profile.hometownProvince,
            profile.hometownDistrict,
          )}
        />
      </section>
    </div>
  );
}

// ── Row ───────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  const empty = !value;
  return (
    <div className="flex items-center py-3">
      <span className="text-body-16 font-medium text-text-tertiary">
        {label}
      </span>
      <span
        className={`ml-auto text-body-16 ${
          empty ? "text-text-secondary" : "font-medium text-text-primary"
        }`}
      >
        {empty ? "미설정" : value}
      </span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="h-20 w-20 rounded-full bg-grey-90 animate-pulse" />
      <div className="h-7 w-32 rounded bg-grey-90 animate-pulse" />
      <div className="h-8 w-24 rounded-full bg-grey-90 animate-pulse" />
    </div>
  );
}
