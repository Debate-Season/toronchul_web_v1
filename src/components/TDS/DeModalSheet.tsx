"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface DeModalSheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 하단 고정 영역 (예: 등록/선택 버튼) */
  footer?: ReactNode;
}

/**
 * 공용 모달/바텀시트 셸. 모바일=하단 시트, 데스크톱=중앙 모달.
 * backdrop 클릭·ESC·닫기 버튼으로 닫힌다. TDS leaf (데이터 의존 없음).
 */
export default function DeModalSheet({
  title,
  onClose,
  children,
  footer,
}: DeModalSheetProps) {
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
      <div className="relative flex w-full max-h-[85vh] flex-col rounded-t-2xl bg-surface sm:mx-4 sm:max-w-md sm:rounded-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-header-18 font-semibold text-text-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">{children}</div>

        {footer && <div className="px-5 pt-3 pb-5">{footer}</div>}
      </div>
    </div>
  );
}
