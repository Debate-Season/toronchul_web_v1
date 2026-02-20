"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithOidc } from "@/lib/api/auth";
import useAuthStore from "@/store/useAuthStore";

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

  const { setTokens, setProfileStatus, setTermsStatus } = useAuthStore();

  // 중복 호출 방지
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get("code");
    if (!code) {
      setError("인가 코드가 없습니다.");
      return;
    }

    handleKakaoLogin(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleKakaoLogin(code: string) {
    try {
      // 1) 카카오 토큰 발급 (id_token 획득)
      const idToken = await exchangeCodeForIdToken(code);

      // 2) 백엔드 OIDC 로그인
      const result = await loginWithOidc({
        socialType: "kakao",
        idToken,
      });

      // 3) 스토어에 저장
      setTokens(result.accessToken, result.refreshToken);
      setProfileStatus(result.profileStatus);
      setTermsStatus(result.termsStatus);

      // 4) 메인 페이지로 이동
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
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

// ── 카카오 인가 코드 → id_token 교환 ──────────────
async function exchangeCodeForIdToken(code: string): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? "";
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ?? "";

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`카카오 토큰 발급 실패: ${res.status}`);
  }

  const data = await res.json();

  if (!data.id_token) {
    throw new Error("id_token이 응답에 포함되어 있지 않습니다.");
  }

  return data.id_token;
}
