"use client";

import { useEffect, useRef, useState } from "react";
import { User, Settings, LogIn, LogOut, Flame, Menu, Download } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  fetchBestChatRooms,
  type BestChatRoom,
} from "@/lib/api/home";
import useAuthStore from "@/store/useAuthStore";
import { threadHref } from "@/lib/slug";
import { performLogout } from "@/lib/auth/logout";
import DeConfirmDialog from "@/components/TDS/DeConfirmDialog";
import LoginModal from "@/components/auth/LoginModal";
import YoutubeFloatingPlayer from "@/components/home/YoutubeFloatingPlayer";
import AppDownloadModal from "@/components/layout/AppDownloadModal";
import MobileNavModal from "@/components/layout/MobileNavModal";
import { PUBLIC_NAV_ITEMS } from "@/components/layout/navItems";
import { RNB_SLOT_ID } from "@/lib/layoutSlots";

/**
 * 토론방 라우트(`/issue/[id]/[slug]/[threadId]/[threadSlug]`) 판별.
 *
 * 이 화면에서만 우측 사이드바가 "실시간 핫한 토론" 대신 **토론방이 채우는 빈
 * 자리**가 된다. 이슈 상세(`/issue/[id]/[slug]`, 세그먼트 3개)는 해당 없다.
 */
function isDebateRoomPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length === 5 && segments[0] === "issue";
}

// ── Top Bar ────────────────────────────────────────
// minimal: 온보딩용. 로고는 홈 이동 비활성화, 로그인 버튼 없음.
// 프로필 아이콘 클릭 시 아이콘 아래에 작은 드롭다운 메뉴를 연다.
// - 일반: "프로필"(→ /profile 별도 페이지), "설정"(→ /settings 모달), "로그아웃".
// - 온보딩(minimal): 아직 프로필/설정 접근 불가하므로 "로그아웃"만 노출(이탈 경로).
function TopBar({ minimal = false }: { minimal?: boolean }) {
  const router = useRouter();
  const { accessToken, _hasHydrated } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showAppDownload, setShowAppDownload] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 드롭다운: 바깥 클릭·ESC 로 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const go = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await performLogout();
    router.replace("/");
  };

  const logo = (
    <span className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/img_splash_logo.png" alt="토론철" height={28} style={{ height: 28, width: "auto" }} />
      <span className="text-header-18 font-bold text-brand">토론철</span>
    </span>
  );

  const menuItemClass =
    "flex w-full items-center gap-2.5 px-4 py-2.5 text-body-14 font-medium text-text-primary transition-colors hover:bg-grey-100 cursor-pointer";

  const profileMenu = (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="프로필"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-elevated hover:bg-grey-80 transition-colors cursor-pointer"
      >
        <User size={20} className="text-text-secondary" />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg z-[60]"
        >
          {!minimal && (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => go("/profile")}
                className={menuItemClass}
              >
                <User size={16} className="text-text-secondary" />
                프로필
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => go("/settings/account")}
                className={menuItemClass}
              >
                <Settings size={16} className="text-text-secondary" />
                설정
              </button>
            </>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setShowLogoutConfirm(true);
            }}
            className={menuItemClass}
          >
            <LogOut size={16} className="text-text-secondary" />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );

  // 모바일 전역 메뉴 트리거. `lg` 이상은 좌측 LNB 가 상시 노출이라 숨긴다.
  // 위치는 프로필 아이콘(비로그인이면 로그인 버튼)의 오른쪽.
  const hamburger = (
    <button
      type="button"
      onClick={() => setShowNav(true)}
      aria-label="메뉴"
      aria-haspopup="dialog"
      aria-expanded={showNav}
      className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-grey-90 hover:text-text-primary cursor-pointer lg:hidden"
    >
      <Menu size={22} />
    </button>
  );

  return (
    <>
      <header className="fixed top-0 left-0 w-full h-14 z-50 flex items-center justify-between px-4 bg-surface border-b border-border">
        {minimal ? (
          logo
        ) : (
          <Link href="/" className="flex items-center gap-2">
            {logo}
          </Link>
        )}
        <div className="flex items-center gap-1.5">
          {minimal ? (
            profileMenu
          ) : _hasHydrated && !accessToken ? (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-body-14 font-semibold text-white transition-colors hover:opacity-90 cursor-pointer"
            >
              <LogIn size={16} />
              로그인
            </button>
          ) : (
            profileMenu
          )}
          {!minimal && hamburger}
        </div>
      </header>

      {showNav && (
        <MobileNavModal
          onClose={() => setShowNav(false)}
          onAppDownload={() => setShowAppDownload(true)}
        />
      )}
      {showAppDownload && (
        <AppDownloadModal onClose={() => setShowAppDownload(false)} />
      )}

      {!minimal && showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showLogoutConfirm && (
        <DeConfirmDialog
          title="로그아웃 하시겠습니까?"
          doneText="로그아웃"
          cancelText="취소"
          onDone={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}

// ── Left Sidebar (LNB) ────────────────────────────
function LeftSidebar() {
  const pathname = usePathname();
  const [showAppDownload, setShowAppDownload] = useState(false);

  // 모바일 메뉴와 같은 목록을 쓴다(`navItems.ts`).
  const navItems = PUBLIC_NAV_ITEMS;

  return (
    <>
      <aside className="fixed left-0 top-14 w-64 h-[calc(100vh-3.5rem)] hidden lg:flex lg:flex-col bg-surface border-r border-border overflow-y-auto">
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
// 토론방에서는 토론방이 portal 로 채우는 빈 자리, 그 외에는 "실시간 핫한 토론".
// 레이아웃이 `room/` 컴포넌트를 직접 import 하지 않으려는 것 — 불문율 #7.
function RightSidebar() {
  const pathname = usePathname();
  const inDebateRoom = isDebateRoomPath(pathname);

  return (
    <aside className="fixed right-0 top-14 w-80 h-[calc(100vh-3.5rem)] hidden md:block overflow-y-auto">
      <div className="p-4">
        {inDebateRoom ? <div id={RNB_SLOT_ID} /> : <HotDebateCard />}
      </div>
    </aside>
  );
}

function HotDebateCard() {
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
    <div className="rounded-xl border border-border p-4">
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
                href={threadHref(topic.issueId, topic.issueTitle, topic.debateId, topic.debateTitle)}
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
  );
}

// ── 온보딩 미완료 가드 ─────────────────────────────
// 로그인했지만 약관/프로필 미완료(status === false)면 온보딩으로 강제 이동.
// 페이지 이탈 후 재진입·다른 세션·재로그인 등 어떤 경로로 들어와도 동작.
function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { _hasHydrated, isLogin, termsStatus, profileStatus } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated || !isLogin) return;
    // 로그인/OAuth 콜백은 자체적으로 리다이렉트 처리하므로 제외
    if (pathname.startsWith("/login") || pathname.startsWith("/oauth")) return;

    if (termsStatus === false) {
      router.replace("/onboarding/terms");
    } else if (profileStatus === false) {
      router.replace("/onboarding/profile");
    }
  }, [_hasHydrated, isLogin, termsStatus, profileStatus, pathname, router]);

  return null;
}

// ── RedditLayout (조립) ───────────────────────────
export default function RedditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 신규 가입 온보딩은 좌/우 사이드바 없는 별도 전체화면 페이지.
  // 상단 바는 로고만(홈 이동·프로필·로그인·메뉴 액션 없음) 유지.
  if (pathname.startsWith("/onboarding")) {
    return (
      <>
        <TopBar minimal />
        <main className="pt-14 min-h-screen flex justify-center">
          <div className="max-w-2xl w-full p-4">{children}</div>
        </main>
      </>
    );
  }

  return (
    <>
      <OnboardingGuard />
      <TopBar />
      <LeftSidebar />
      <RightSidebar />

      {/*
        하단 고정 탭을 상단 햄버거 메뉴로 옮기면서 모바일 하단 여백(pb-20)이
        필요 없어졌다. 덕분에 토론방의 높이 계산도 브레이크포인트별로 갈리지
        않고 한 값으로 통일된다(`DebateRoom` 참고).
      */}
      <main className="pt-14 md:mr-80 lg:ml-64 min-h-screen flex justify-center">
        <div className="max-w-2xl w-full p-4">{children}</div>
      </main>

      {/* 유튜브 라이브 플로팅 플레이어 — 레이아웃에 마운트되어 페이지 이동 중에도 재생 유지 */}
      <YoutubeFloatingPlayer />
    </>
  );
}
