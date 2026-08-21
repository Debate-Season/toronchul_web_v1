"use client";

import { useEffect } from "react";
import DeBubbleMark from "@/components/TDS/DeBubbleMark";
import "./globals.css";

/**
 * 루트 레이아웃 자체가 렌더에 실패했을 때의 최후 경계.
 *
 * 루트 레이아웃을 **대체**하므로 html/body 를 직접 그려야 하고, globals.css 도
 * 여기서 다시 import 해야 토큰이 산다. RedditLayout 은 쓰지 않는다 — 그게
 * 터졌을 수도 있는데 다시 부르면 같은 자리에서 또 죽는다.
 *
 * 같은 이유로 next/link 대신 <a> 를 쓴다. 라우터가 성한지 보장할 수 없으니
 * 전체 새로고침으로 나가는 편이 확실하다.
 *
 * 개발 모드에서는 Next 의 에러 오버레이가 먼저 뜨므로 프로덕션에서만 보인다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error.digest ?? "(no digest)", error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="antialiased">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6 text-center">
          <div className="w-40">
            <DeBubbleMark label="!" gradientId="globalErrorBubble" fontSize={76} />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-header-24 font-bold text-text-primary">
              페이지를 불러오지 못했어요
            </h1>
            <p className="text-body-14 text-text-secondary">
              잠시 후 다시 시도해 주세요.
            </p>
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
              className="cursor-pointer rounded-xl bg-brand px-5 py-3 text-body-14 font-medium text-grey-10 transition-colors hover:bg-brand-dark"
            >
              다시 시도
            </button>
            {/*
              Link 가 아니라 <a> 인 것은 의도다. 클라이언트 내비게이션은 깨진
              루트 레이아웃을 그대로 다시 렌더하지만, 하드 내비게이션은 클라이언트
              상태를 통째로 버리고 새 문서를 받는다. 여기까지 왔다는 건 그 상태를
              신뢰할 수 없다는 뜻이다.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="rounded-xl border border-border px-5 py-3 text-body-14 text-text-secondary transition-colors hover:bg-grey-90"
            >
              홈으로
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
