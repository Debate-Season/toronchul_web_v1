"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Download } from "lucide-react";
import { PUBLIC_NAV_ITEMS } from "@/components/layout/navItems";

interface MobileNavModalProps {
  onClose: () => void;
  /** 앱 다운로드 모달을 여는 쪽은 레이아웃 — 메뉴는 닫히고 그 위에 뜬다 */
  onAppDownload: () => void;
}

/**
 * 모바일(`lg` 미만) 전역 메뉴. 상단 바의 햄버거로 열린다.
 *
 * 하단 고정 탭을 대체한 것이다. 탭은 화면 아래 한 줄(64px + 본문 여백 80px)을
 * 상시 점유했고, 토론방처럼 높이를 꽉 쓰는 화면에서 **채팅 입력창과 자리를
 * 다퉜다.** 항목이 3개뿐이라 그만한 자리를 늘 내줄 이유가 없었다.
 *
 * 반투명 배경이 아니라 **불투명 surface** 로 화면을 다 덮는다 — 팝오버가 아니라
 * "메뉴 화면"으로 읽혀야 한다.
 */
export default function MobileNavModal({
  onClose,
  onAppDownload,
}: MobileNavModalProps) {
  const pathname = usePathname();

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
      role="dialog"
      aria-modal="true"
      aria-label="메뉴"
      className="fixed inset-0 z-[100] flex flex-col bg-surface"
    >
      {/* `lg` 미만 전용이지만 태블릿 폭(~1023px)에서 항목이 좌우로 늘어지지
          않도록 본문 폭을 제한한다. */}
      <div className="mx-auto flex h-14 w-full max-w-md flex-shrink-0 items-center justify-end px-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="메뉴 닫기"
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-grey-90 hover:text-text-primary cursor-pointer"
        >
          <X size={22} />
        </button>
      </div>

      <nav className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 overflow-y-auto p-3">
        {PUBLIC_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-3.5 text-body-16 font-medium transition-colors ${
                isActive
                  ? "bg-grey-90 text-brand"
                  : "text-text-secondary hover:bg-grey-100 hover:text-text-primary"
              }`}
            >
              <Icon
                size={22}
                className={isActive ? "text-brand" : "text-text-secondary"}
              />
              {label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => {
            onClose();
            onAppDownload();
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-3.5 text-body-16 font-medium text-text-secondary transition-colors hover:bg-grey-100 hover:text-text-primary cursor-pointer"
        >
          <Download size={22} />
          앱 다운로드
        </button>
      </nav>
    </div>
  );
}
