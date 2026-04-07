"use client";

import { redirectToKakao } from "@/lib/auth/kakao";
import { redirectToApple } from "@/lib/auth/apple";

// ── Page ──────────────────────────────────────────
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* 로고 / 타이틀 */}
      <div className="mb-12 text-center">
        <h1 className="text-header-28 font-bold text-text-primary">토론철</h1>
        <p className="mt-2 text-body-14 text-text-secondary">
          나의 의견을 자유롭게 펼쳐보세요
        </p>
      </div>

      {/* 로그인 버튼 그룹 */}
      <div className="flex w-full max-w-sm flex-col gap-3">
        {/* 카카오 로그인 */}
        <button
          type="button"
          onClick={redirectToKakao}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-kakao py-3 text-body-16 font-medium text-black cursor-pointer transition-colors hover:brightness-95"
        >
          <KakaoIcon />
          카카오로 시작하기
        </button>

        {/* Apple 로그인 */}
        <button
          type="button"
          onClick={redirectToApple}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-body-16 font-medium text-white cursor-pointer transition-colors hover:brightness-125"
        >
          <AppleIcon />
          Apple로 시작하기
        </button>
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

// ── Kakao Icon (inline SVG) ──────────────────────
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
