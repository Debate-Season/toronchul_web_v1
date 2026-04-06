"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithOidc } from "@/lib/api/auth";
import useAuthStore from "@/store/useAuthStore";
import { verifyOAuthState, exchangeCodeForIdToken } from "@/lib/auth/kakao";

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-body-16 text-text-secondary animate-pulse">
            카카오 로그인 처리 중...
          </p>
        </div>
      }
    >
      <KakaoCallbackContent />
    </Suspense>
  );
}

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const { isLogin, setTokens, setProfileStatus, setTermsStatus } = useAuthStore();

  // 중복 호출 방지
  const processed = useRef(false);

  // 이미 로그인 상태면 홈으로
  useEffect(() => {
    if (isLogin) router.replace("/");
  }, [isLogin, router]);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    // 카카오에서 에러로 돌아온 경우
    if (errorParam) {
      setError("카카오 인증이 취소되었습니다.");
      return;
    }

    if (!code) {
      // 인가 코드 없이 직접 접근 또는 새로고침 → 조용히 홈으로
      router.replace("/");
      return;
    }

    if (!verifyOAuthState(state)) {
      setError("잘못된 인증 요청입니다. 다시 로그인해 주세요.");
      return;
    }

    handleKakaoLogin(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleKakaoLogin(code: string) {
    try {
      const idToken = await exchangeCodeForIdToken(code);

      const result = await loginWithOidc({
        socialType: "kakao",
        idToken,
      });

      setTokens(result.accessToken, result.refreshToken);
      setProfileStatus(result.profileStatus);
      setTermsStatus(result.termsStatus);

      router.push("/");
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-body-16 text-red">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-body-14 text-brand underline cursor-pointer"
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-body-16 text-text-secondary animate-pulse">
        카카오 로그인 처리 중...
      </p>
    </div>
  );
}

// ── 에러 메시지 매핑 ────────────────────────────────
function toUserMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";

  // 카카오 토큰 교환 실패 (인가 코드 1회용 재사용 포함)
  if (msg.includes("KOE320") || msg.includes("authorization code"))
    return "인증 정보가 만료되었습니다. 다시 로그인해 주세요.";

  // 백엔드 에러 코드 매핑
  if (msg.includes("ID_TOKEN_SIGNATURE_VALIDATION_FAILED"))
    return "인증 토큰 검증에 실패했습니다. 다시 시도해 주세요.";
  if (msg.includes("ID_TOKEN_DECODING_FAILED"))
    return "인증 토큰을 처리할 수 없습니다. 다시 시도해 주세요.";
  if (msg.includes("NOT_SUPPORTED_SOCIAL_TYPE"))
    return "지원하지 않는 로그인 방식입니다.";

  // 네트워크/타임아웃
  if (msg.includes("네트워크") || msg.includes("시간이 초과"))
    return msg;

  return "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

