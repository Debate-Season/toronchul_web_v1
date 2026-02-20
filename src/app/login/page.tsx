"use client";

import DeButtonLarge from "@/components/TDS/DeButtonLarge";

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

        {/* Apple 로그인 (placeholder) */}
        <DeButtonLarge
          text="Apple로 시작하기"
          onPressed={() => {
            /* TODO: Apple Sign-In */
          }}
          enable={false}
        />
      </div>
    </div>
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
