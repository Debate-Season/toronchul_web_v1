"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { performLogout } from "@/lib/auth/logout";
import { getMyProfile, type MyProfile } from "@/lib/api/profile";
import { imageUrl } from "@/lib/imageUrl";
import { KAKAO_CHANNEL_URL, POLICY_LINKS } from "@/lib/profile/constants";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import DeConfirmDialog from "@/components/TDS/DeConfirmDialog";

interface ProfileContentProps {
  /** 최상단 "프로필" 헤딩 표시 (다이얼로그에서는 셸 타이틀이 있으므로 false) */
  showHeading?: boolean;
  /** 내부 라우트 이동 시 호출 (다이얼로그 닫기 등) */
  onNavigate?: () => void;
}

/** 프로필 메인 콘텐츠. /profile 페이지와 프로필 다이얼로그가 공용으로 사용. */
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
  const [showLogout, setShowLogout] = useState(false);

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

  const handleLogout = useCallback(async () => {
    setShowLogout(false);
    onNavigate?.();
    await performLogout();
    router.replace("/");
  }, [router, onNavigate]);

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

      {/* 고객 센터 */}
      <section>
        <h2 className="mb-3 text-header-18 font-semibold text-text-primary">
          고객 센터
        </h2>
        <ExternalRow label="카카오 채널 문의하기" href={KAKAO_CHANNEL_URL} />
      </section>

      {/* 법적 정보 및 정책 */}
      <section>
        <h2 className="mb-1 text-header-18 font-semibold text-text-primary">
          법적 정보 및 정책
        </h2>
        <InternalRow
          label="약관 및 개인정보 처리 동의"
          href="/profile/terms"
          onClick={onNavigate}
        />
        {POLICY_LINKS.map((link) => (
          <ExternalRow key={link.url} label={link.label} href={link.url} />
        ))}
      </section>

      {/* 계정 */}
      <section>
        <h2 className="mb-1 text-header-18 font-semibold text-text-primary">
          계정
        </h2>
        <button
          type="button"
          onClick={() => setShowLogout(true)}
          className="flex w-full items-center py-3 cursor-pointer"
        >
          <span className="text-body-16 font-medium text-text-tertiary">
            로그아웃
          </span>
          <LogOut size={20} className="ml-auto text-text-secondary" />
        </button>
        <InternalRow
          label="회원탈퇴"
          href="/profile/withdraw"
          icon="logout"
          onClick={onNavigate}
        />
      </section>

      {showLogout && (
        <DeConfirmDialog
          title="로그아웃 하시겠습니까?"
          doneText="로그아웃"
          cancelText="취소"
          onDone={handleLogout}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </div>
  );
}

// ── Rows ──────────────────────────────────────────
function ExternalRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center py-3"
    >
      <span className="text-body-16 font-medium text-text-tertiary">
        {label}
      </span>
      <ChevronRight size={20} className="ml-auto text-text-secondary" />
    </a>
  );
}

function InternalRow({
  label,
  href,
  icon = "chevron",
  onClick,
}: {
  label: string;
  href: string;
  icon?: "chevron" | "logout";
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center py-3">
      <span className="text-body-16 font-medium text-text-tertiary">
        {label}
      </span>
      {icon === "logout" ? (
        <LogOut size={20} className="ml-auto text-text-secondary" />
      ) : (
        <ChevronRight size={20} className="ml-auto text-text-secondary" />
      )}
    </Link>
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
