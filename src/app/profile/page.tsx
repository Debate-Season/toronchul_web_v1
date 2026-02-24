"use client";

import Link from "next/link";
import useAuthStore from "@/store/useAuthStore";

export default function ProfilePage() {
  const { isLogin, _hasHydrated, logout } = useAuthStore();

  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-32 rounded bg-grey-90 animate-pulse" />
      </div>
    );
  }

  if (!isLogin) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-header-20 font-bold text-text-primary">프로필</p>
        <p className="text-body-14 text-text-secondary">
          로그인 후 이용할 수 있습니다.
        </p>
        <Link
          href="/login"
          className="rounded-lg bg-brand px-6 py-2.5 text-body-14 font-semibold text-white transition-colors hover:opacity-90"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <h1 className="text-header-20 font-bold text-text-primary">프로필</h1>

      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <p className="text-body-14 text-text-secondary">
          프로필 기능은 준비 중입니다.
        </p>
      </div>

      <button
        type="button"
        onClick={logout}
        className="self-start rounded-lg border border-border px-4 py-2 text-body-14 text-text-secondary transition-colors hover:bg-grey-90 cursor-pointer"
      >
        로그아웃
      </button>
    </div>
  );
}
