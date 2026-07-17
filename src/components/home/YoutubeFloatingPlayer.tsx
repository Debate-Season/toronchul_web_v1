"use client";

import { X } from "lucide-react";
import useYoutubePlayerStore from "@/store/useYoutubePlayerStore";

/**
 * 우하단 논모달 플로팅 미니 플레이어(faux-PiP).
 * 공식 YouTube IFrame 플레이어를 페이지 위에 "보이는 상태로" 띄운다 — 모달이 아니라
 * 나머지 페이지를 그대로 조작·이동할 수 있다. 루트 레이아웃에 마운트되어
 * 홈→이슈맵→이슈→토론 등 소프트 내비게이션 동안 재생이 유지된다.
 *
 * 정책 준수:
 * - 공식 임베드로만 재생, 항상 화면에 보이게 유지(숨김/오디오-only=background player 금지).
 * - 플레이어 위 오버레이 없음(닫기 X 는 상단 바 = 플레이어 밖, 제목/채널은 영상 아래).
 * - allow 에 picture-in-picture 위임 → 사용자가 브라우저 기본 PiP 사용 가능.
 * - 닫기 시 정지(iframe 언마운트).
 */
export default function YoutubeFloatingPlayer() {
  const current = useYoutubePlayerStore((s) => s.current);
  const close = useYoutubePlayerStore((s) => s.close);

  if (!current) return null;

  const embedSrc = `https://www.youtube.com/embed/${current.videoId}?autoplay=1&rel=0&playsinline=1`;

  return (
    <div className="fixed inset-x-0 bottom-20 z-[90] overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl sm:inset-x-auto sm:right-4 sm:w-[400px] sm:rounded-2xl lg:bottom-4">
      {/* 상단 바: 닫기 X (플레이어 밖) */}
      <div className="flex justify-end px-2 py-1.5">
        <button
          type="button"
          onClick={close}
          aria-label="닫기"
          className="text-text-secondary transition-colors hover:text-text-primary cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* 공식 IFrame 플레이어 (오버레이 없음) */}
      <div className="aspect-video w-full bg-black">
        <iframe
          key={current.videoId}
          src={embedSrc}
          title={current.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      {/* 영상 아래: 제목 + 채널 */}
      <div className="px-3 py-2">
        <p className="truncate text-body-14 font-semibold text-text-primary">
          {current.title}
        </p>
        <p className="mt-0.5 truncate text-caption-12 text-text-secondary">
          {current.channel}
        </p>
      </div>
    </div>
  );
}
