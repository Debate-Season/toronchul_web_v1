import type { Metadata } from "next";
import Link from "next/link";
import { Home, Map } from "lucide-react";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요 · 토론철",
};

/**
 * 404 페이지. 매칭되는 라우트가 없을 때와 `notFound()` 호출 시 모두 여기로 온다.
 *
 * RedditLayout 안에서 렌더되므로 상단 바·사이드바가 그대로 남는다 — 막다른
 * 길에서도 이동 경로가 살아 있다. 그래서 본문은 이탈 경로 두 개(홈·이슈맵)만
 * 제시하고 끝낸다.
 *
 * 서버 컴포넌트다. 정적 마크업과 Link 뿐이라 클라이언트 번들에 실을 이유가 없다.
 */
export default function NotFound() {
  return (
    // 5.5rem = 상단 바 3.5rem + RedditLayout 컨테이너의 p-4 위아래 2rem.
    // 그만큼 빼야 스크롤 없이 남은 높이를 정확히 채운다(DebateRoom 과 같은 계산).
    <div className="flex min-h-[calc(100dvh-5.5rem)] flex-col items-center justify-center gap-8 text-center">
      {/*
        로고 모티프인 말풍선. 꼬리까지 한 도형이라 그라데이션이 끊기지 않게
        SVG 로 그린다. 숫자도 같은 viewBox 안에 넣어야 도형과 함께 스케일된다
        — 밖에서 absolute 로 얹으면 크기를 바꿀 때마다 위치를 다시 맞춰야 한다.
      */}
      <svg viewBox="0 0 200 140" className="w-40" aria-hidden="true">
        <defs>
          <linearGradient id="notFoundBubble" x1="0" y1="0" x2="1" y2="0.8">
            <stop offset="0%" stopColor="var(--color-image-red)" />
            <stop offset="50%" stopColor="var(--color-brand)" />
            <stop offset="100%" stopColor="var(--color-blue)" />
          </linearGradient>
        </defs>
        <path
          d="M20 0 H180 A20 20 0 0 1 200 20 V90 A20 20 0 0 1 180 110 H58 L0 140 V20 A20 20 0 0 1 20 0 Z"
          fill="url(#notFoundBubble)"
        />
        {/* 꼬리를 뺀 본체(0~110)의 중앙 */}
        <text
          x="100"
          y="55"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="52"
          fontWeight="700"
          letterSpacing="-2"
          fill="var(--color-white)"
        >
          404
        </text>
      </svg>

      <div className="flex flex-col gap-2">
        <h1 className="text-header-24 font-bold text-text-primary">
          찾으시는 페이지가 없어요
        </h1>
        <p className="text-body-14 text-text-secondary">
          주소가 바뀌었거나 삭제된 페이지일 수 있어요.
          <br />
          입력하신 주소가 정확한지 확인해 주세요.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-body-14 font-medium text-grey-10 transition-colors hover:bg-brand-dark"
        >
          <Home size={16} />
          홈으로
        </Link>
        <Link
          href="/map"
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-body-14 text-text-secondary transition-colors hover:bg-grey-90"
        >
          <Map size={16} />
          이슈맵 보기
        </Link>
      </div>
    </div>
  );
}
