"use client";

import { useEffect } from "react";
import { X, Smartphone } from "lucide-react";

interface AppDownloadModalProps {
  onClose: () => void;
}

/**
 * 앱 다운로드 안내. 모바일은 바텀시트, `sm` 이상은 중앙 다이얼로그.
 *
 * 좌측 LNB 와 모바일 메뉴 양쪽에서 열기 때문에 별도 파일로 둔다.
 */
export default function AppDownloadModal({ onClose }: AppDownloadModalProps) {
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

function AppleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.94 13.41c-.33.76-.49 1.1-.91 1.77-.59.93-1.43 2.09-2.46 2.1-1.03.01-1.29-.67-2.69-.66-1.39.01-1.68.67-2.71.66-1.04-.01-1.83-1.05-2.42-1.98C2.25 13.01 2.1 10.2 3.21 8.71c.79-1.06 2.03-1.68 3.19-1.68 1.19 0 1.94.67 2.92.67.96 0 1.54-.67 2.92-.67.99 0 2.09.49 2.88 1.34-2.53 1.39-2.12 5.01.82 5.04ZM11.51 5.34c.46-.59.81-1.42.68-2.27-.75.05-1.63.53-2.14 1.15-.46.56-.85 1.4-.7 2.21.82.03 1.67-.46 2.16-1.09Z"
        fill="white"
      />
    </svg>
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
