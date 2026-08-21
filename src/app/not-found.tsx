import type { Metadata } from "next";
import Link from "next/link";
import { Home, Map } from "lucide-react";
import DeBubbleMark from "@/components/TDS/DeBubbleMark";

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
      <div className="w-40">
        <DeBubbleMark label="404" gradientId="notFoundBubble" />
      </div>

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
