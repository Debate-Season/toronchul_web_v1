"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { performLogout } from "@/lib/auth/logout";
import { getMyProfile, type MyProfile } from "@/lib/api/profile";
import { socialTypeLabel } from "@/lib/profile/constants";
import DeConfirmDialog from "@/components/TDS/DeConfirmDialog";

/**
 * 계정 콘텐츠. 설정 메뉴 "계정"(/settings/account).
 * 로그인 방식(소셜 종류)은 GET /profiles/me 의 socialType 으로 노출.
 */
export default function SettingsAccountContent() {
  const router = useRouter();
  const { accessToken, isLogin, _hasHydrated } = useAuthStore();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    if (!_hasHydrated || !isLogin) return;

    let cancelled = false;

    async function load() {
      try {
        const data = await getMyProfile(accessToken);
        if (!cancelled) setProfile(data);
      } catch {
        // 조용히 무시 — 값 없으면 "-" 표시
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [_hasHydrated, isLogin, accessToken]);

  const handleLogout = async () => {
    setShowLogout(false);
    await performLogout();
    router.replace("/");
  };

  const label = profile ? socialTypeLabel(profile.socialType) : "-";

  return (
    <div className="flex flex-col gap-10 py-2">
      {/* 로그인 정보 */}
      <section>
        <h2 className="mb-3 text-header-18 font-semibold text-text-primary">
          로그인 정보
        </h2>
        <div className="flex items-center py-2">
          <span className="text-body-16 font-medium text-text-tertiary">
            소셜 로그인
          </span>
          <span className="ml-auto text-body-16 font-medium text-text-primary">
            {label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowLogout(true)}
          className="mt-3 w-full rounded-xl border border-border py-3 text-body-16 font-medium text-text-secondary transition-colors hover:bg-grey-90 cursor-pointer"
        >
          로그아웃
        </button>
      </section>

      {/* 계정 관리 */}
      <section>
        <h2 className="mb-1 text-header-18 font-semibold text-text-primary">
          계정 관리
        </h2>
        <Link
          href="/settings/account/delete"
          replace
          className="flex items-center py-3"
        >
          <span className="text-body-16 font-medium text-text-tertiary">
            계정 삭제
          </span>
          <ChevronRight size={20} className="ml-auto text-text-secondary" />
        </Link>
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
