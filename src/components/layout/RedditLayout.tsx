"use client";

import { useEffect, useState } from "react";
import { Home, Map, User, LogIn, Flame, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  fetchBestChatRooms,
  type BestChatRoom,
} from "@/lib/api/home";
import useAuthStore from "@/store/useAuthStore";
import DeButtonLarge from "@/components/TDS/DeButtonLarge";

// ── 공통 메뉴 (비로그인도 접근 가능) ──────────────────
const PUBLIC_NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/map", label: "이슈맵", icon: Map },
] as const;

// ── Kakao OAuth ───────────────────────────────────
function redirectToKakao() {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

  const url =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri ?? "")}` +
    `&response_type=code` +
    `&scope=openid`;

  window.location.href = url;
}

function KakaoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1C4.58 1 1 3.79 1 7.21C1 9.28 2.36 11.1 4.39 12.19L3.53 15.38C3.46 15.62 3.72 15.82 3.93 15.68L7.63 13.31C8.08 13.36 8.54 13.39 9 13.39C13.42 13.39 17 10.6 17 7.18C17 3.79 13.42 1 9 1Z"
        fill="black"
      />
    </svg>
  );
}

// ── 로그인 모달 ───────────────────────────────────
function LoginModal({ onClose }: { onClose: () => void }) {
  // 배경 클릭 시 닫기
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-surface p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="mb-8 text-center">
          <h2 className="text-header-24 font-bold text-text-primary">토론철</h2>
          <p className="mt-2 text-body-14 text-text-secondary">
            나의 의견을 자유롭게 펼쳐보세요
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={redirectToKakao}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-kakao py-3 text-body-16 font-medium text-black cursor-pointer transition-colors hover:brightness-95"
          >
            <KakaoIcon />
            카카오로 시작하기
          </button>

          <DeButtonLarge
            text="Apple로 시작하기"
            onPressed={() => {
              /* TODO: Apple Sign-In */
            }}
            enable={false}
          />
        </div>
      </div>
    </div>
  );
}

// ── Top Bar ────────────────────────────────────────
function TopBar() {
  const { accessToken, _hasHydrated } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 w-full h-14 z-50 flex items-center justify-between px-4 bg-surface border-b border-border">
        <Link href="/" className="text-header-18 font-bold text-brand">
          토론철
        </Link>
        {_hasHydrated && !accessToken ? (
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-body-14 font-semibold text-white transition-colors hover:opacity-90 cursor-pointer"
          >
            <LogIn size={16} />
            로그인
          </button>
        ) : (
          <Link
            href="/profile"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-elevated hover:bg-grey-80 transition-colors"
          >
            <User size={20} className="text-text-secondary" />
          </Link>
        )}
      </header>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}

// ── Left Sidebar (LNB) ────────────────────────────
function LeftSidebar() {
  const pathname = usePathname();
  const { accessToken } = useAuthStore();

  const navItems = accessToken
    ? [...PUBLIC_NAV_ITEMS, { href: "/profile", label: "프로필", icon: User } as const]
    : PUBLIC_NAV_ITEMS;

  return (
    <aside className="fixed left-0 top-14 w-64 h-[calc(100vh-3.5rem)] hidden md:block bg-surface border-r border-border overflow-y-auto">
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-14 font-medium transition-colors ${
                isActive
                  ? "bg-grey-90 text-brand"
                  : "text-text-secondary hover:bg-grey-100 hover:text-text-primary"
              }`}
            >
              <Icon
                size={20}
                className={isActive ? "text-brand" : "text-text-secondary"}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// ── Right Sidebar (RNB) ───────────────────────────
function RightSidebar() {
  const { accessToken, _hasHydrated } = useAuthStore();
  const [topics, setTopics] = useState<BestChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;

    let cancelled = false;

    async function load() {
      try {
        const rooms = await fetchBestChatRooms(accessToken);
        if (!cancelled) setTopics(rooms);
      } catch {
        // 사이드바 에러는 조용히 무시
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [_hasHydrated, accessToken]);

  return (
    <aside className="fixed right-0 top-14 w-80 h-[calc(100vh-3.5rem)] hidden lg:block bg-surface border-l border-border overflow-y-auto">
      <div className="p-4">
        <div className="rounded-xl bg-surface-elevated border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={18} className="text-red" />
            <h3 className="text-body-14 font-semibold text-text-primary">
              실시간 핫한 토론
            </h3>
          </div>

          {loading ? (
            <ul className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-4 h-5 rounded bg-grey-90 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 rounded bg-grey-90 animate-pulse mb-1" />
                    <div className="h-4 w-16 rounded bg-grey-90 animate-pulse" />
                  </div>
                </li>
              ))}
            </ul>
          ) : topics.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {topics.map((topic, idx) => (
                <li key={topic.debateId} className="flex items-start gap-3">
                  <span className="text-body-14 font-bold text-brand">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-14 font-medium text-text-primary truncate">
                      {topic.debateTitle}
                    </p>
                    <p className="text-caption-12 text-text-secondary">
                      {topic.issueTitle}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-caption-12 text-text-secondary">
              아직 인기 토론이 없습니다.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

// ── Bottom Nav (모바일) ────────────────────────────
function BottomNav() {
  const pathname = usePathname();
  const { accessToken } = useAuthStore();

  const navItems = accessToken
    ? [...PUBLIC_NAV_ITEMS, { href: "/profile", label: "프로필", icon: User } as const]
    : PUBLIC_NAV_ITEMS;

  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 z-50 flex items-center justify-around bg-surface border-t border-border md:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 text-caption-12 font-medium transition-colors ${
              isActive ? "text-brand" : "text-text-secondary"
            }`}
          >
            <Icon size={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── RedditLayout (조립) ───────────────────────────
export default function RedditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopBar />
      <LeftSidebar />
      <RightSidebar />

      <main className="pt-14 md:ml-64 lg:mr-80 min-h-screen flex justify-center">
        <div className="max-w-2xl w-full p-4 pb-20 md:pb-4">{children}</div>
      </main>

      <BottomNav />
    </>
  );
}
