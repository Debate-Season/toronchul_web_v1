"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCw } from "lucide-react";
import DeBubbleMark from "@/components/TDS/DeBubbleMark";

/**
 * 라우트 세그먼트 에러 경계. 렌더 중 던져진 예외를 여기서 받는다.
 *
 * 루트 레이아웃은 살아 있으므로 RedditLayout 의 상단 바·사이드바가 그대로
 * 남는다 — 404 와 같은 구조다. 루트 레이아웃 자체가 깨진 경우는 여기가 아니라
 * `global-error.tsx` 가 받는다.
 *
 * error.tsx 는 반드시 클라이언트 컴포넌트여야 한다(`reset` 이 이벤트 핸들러).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 프로덕션에서는 메시지가 지워지고 digest 만 남는다. 서버 로그와 대조할
    // 유일한 열쇠라 반드시 같이 남긴다.
    console.error("[error boundary]", error.digest ?? "(no digest)", error);
  }, [error]);

  return (
    // 5.5rem = 상단 바 3.5rem + RedditLayout 컨테이너의 p-4 위아래 2rem.
    <div className="flex min-h-[calc(100dvh-5.5rem)] flex-col items-center justify-center gap-8 text-center">
      <div className="w-40">
        <DeBubbleMark label="!" gradientId="errorBubble" fontSize={76} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-header-24 font-bold text-text-primary">
          문제가 생겼어요
        </h1>
        <p className="text-body-14 text-text-secondary">
          일시적인 오류일 수 있어요.
          <br />
          다시 시도해도 같은 화면이 나오면 잠시 후 방문해 주세요.
        </p>
        {/* 문의 시 서버 로그를 찾을 수 있는 유일한 단서라 화면에도 노출한다. */}
        {error.digest && (
          <p className="text-caption-12 text-text-secondary">
            오류 코드 {error.digest}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-5 py-3 text-body-14 font-medium text-grey-10 transition-colors hover:bg-brand-dark"
        >
          <RotateCw size={16} />
          다시 시도
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-body-14 text-text-secondary transition-colors hover:bg-grey-90"
        >
          <Home size={16} />
          홈으로
        </Link>
      </div>
    </div>
  );
}
