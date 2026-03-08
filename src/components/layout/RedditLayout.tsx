"use client";

import { useEffect, useState } from "react";
import { Home, Map, User, LogIn, Flame, X, Download, Smartphone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  fetchBestChatRooms,
  type BestChatRoom,
} from "@/lib/api/home";
import useAuthStore from "@/store/useAuthStore";
import { roomHref } from "@/lib/slug";
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
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/img_splash_logo.png" alt="토론철" height={28} style={{ height: 28, width: "auto" }} />
          <span className="text-header-18 font-bold text-brand">토론철</span>
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
  const [showAppDownload, setShowAppDownload] = useState(false);

  const navItems = accessToken
    ? [...PUBLIC_NAV_ITEMS, { href: "/profile", label: "프로필", icon: User } as const]
    : PUBLIC_NAV_ITEMS;

  return (
    <>
      <aside className="fixed left-0 top-14 w-64 h-[calc(100vh-3.5rem)] hidden md:flex md:flex-col bg-surface border-r border-border overflow-y-auto">
        <nav className="flex flex-col gap-1 p-3 flex-1">
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

        <div className="p-3 border-t border-border">
          <button
            type="button"
            onClick={() => setShowAppDownload(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-14 font-medium text-text-secondary hover:bg-grey-100 hover:text-text-primary transition-colors cursor-pointer w-full"
          >
            <Download size={20} />
            앱 다운로드
          </button>
        </div>
      </aside>

      {showAppDownload && (
        <AppDownloadModal onClose={() => setShowAppDownload(false)} />
      )}
    </>
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
                <li key={topic.debateId}>
                  <Link
                    href={roomHref(topic.issueId, topic.issueTitle, topic.debateId, topic.debateTitle)}
                    className="flex items-start gap-3 rounded-lg px-1 py-1 -mx-1 transition-colors hover:bg-grey-90 cursor-pointer"
                  >
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
                  </Link>
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

// ── 앱 다운로드 모달 ──────────────────────────────
function AppDownloadModal({ onClose }: { onClose: () => void }) {
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50"
      onClick={handleBackdrop}
    >
      <div className="relative w-full sm:max-w-sm sm:mx-4 rounded-t-2xl sm:rounded-2xl bg-surface p-6 pb-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Smartphone size={24} className="text-brand" />
          <h2 className="text-header-20 font-bold text-text-primary">앱 다운로드</h2>
        </div>
        <p className="text-body-14 text-text-secondary mb-6">
          토론철 앱에서 더 편리하게 이용하세요
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="https://play.google.com/store/apps/details?id=com.rosyocean.debateseason"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-surface-elevated border border-border py-3.5 text-body-16 font-medium text-text-primary transition-colors hover:bg-grey-90 cursor-pointer"
          >
            <GooglePlayIcon />
            Google Play
          </a>
          <a
            href="https://apps.apple.com/kr/app/%ED%86%A0%EB%A1%A0%EC%B2%A0/id6739631545"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-surface-elevated border border-border py-3.5 text-body-16 font-medium text-text-primary transition-colors hover:bg-grey-90 cursor-pointer"
          >
            <AppleIcon />
            App Store
          </a>
        </div>
      </div>
    </div>
  );
}

function GooglePlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.61 1.814A1.82 1.82 0 0 0 3 3.396v17.209a1.82 1.82 0 0 0 .61 1.581l.084.074 9.647-9.647v-.228L3.694 1.74l-.083.074Z" fill="#4285F4"/>
      <path d="m16.557 15.828-3.215-3.216v-.228l3.216-3.216.072.042 3.81 2.164c1.088.618 1.088 1.63 0 2.249l-3.81 2.164-.073.041Z" fill="#FBBC04"/>
      <path d="m16.63 15.787-3.288-3.289L3.61 22.23c.36.38.951.426 1.618.048l11.4-6.49" fill="#EA4335"/>
      <path d="m16.63 8.21-11.4-6.49c-.668-.378-1.26-.332-1.619.049l9.731 9.73 3.288-3.288Z" fill="#34A853"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11Z"/>
    </svg>
  );
}

// ── Bottom Nav (모바일) ────────────────────────────
function BottomNav() {
  const pathname = usePathname();
  const { accessToken } = useAuthStore();
  const [showAppDownload, setShowAppDownload] = useState(false);

  const navItems = accessToken
    ? [...PUBLIC_NAV_ITEMS, { href: "/profile", label: "프로필", icon: User } as const]
    : PUBLIC_NAV_ITEMS;

  return (
    <>
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
        <button
          type="button"
          onClick={() => setShowAppDownload(true)}
          className="flex flex-col items-center gap-1 text-caption-12 font-medium text-text-secondary transition-colors cursor-pointer"
        >
          <Download size={22} />
          앱 다운로드
        </button>
      </nav>

      {showAppDownload && (
        <AppDownloadModal onClose={() => setShowAppDownload(false)} />
      )}
    </>
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
