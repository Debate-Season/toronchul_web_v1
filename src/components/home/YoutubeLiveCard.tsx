"use client";

import { Play, Radio } from "lucide-react";
import type { YoutubeLiveItem } from "@/lib/api/home";
import useYoutubePlayerStore from "@/store/useYoutubePlayerStore";

// 백엔드 title 에 섞여 오는 HTML 엔티티(&#39; 등) 디코드 (SSR 안전한 결정적 치환).
function decodeEntities(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&#34;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * 실시간 Live 섹션용 유튜브 라이브 카드.
 * 썸네일(파사드) 클릭 → 공유 스토어에 등록 → 우하단 플로팅 플레이어(YoutubeFloatingPlayer)로 재생.
 */
export default function YoutubeLiveCard({ data }: { data: YoutubeLiveItem }) {
  const openPlayer = useYoutubePlayerStore((s) => s.open);
  const title = decodeEntities(data.title);
  const channel = data.supplier.trim();
  const thumbnail = `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`;

  return (
    <article className="w-full overflow-hidden rounded-2xl border border-border bg-surface-elevated">
      {/* 썸네일 파사드 (클릭 시 플로팅 플레이어 재생) */}
      <button
        type="button"
        onClick={() =>
          openPlayer({ videoId: data.videoId, title, channel })
        }
        aria-label={`${title} 재생`}
        className="group relative block aspect-video w-full cursor-pointer bg-grey-90"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={title}
          className="h-full w-full object-cover"
        />
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5">
          <Radio size={12} className="text-red" />
          <span className="text-caption-12 font-semibold text-white">LIVE</span>
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 transition-transform group-hover:scale-110">
            <Play size={24} className="translate-x-0.5 text-white" fill="currentColor" />
          </span>
        </span>
      </button>

      {/* 제목 + 채널 */}
      <div className="p-3">
        <h3 className="text-body-14 font-semibold text-text-primary line-clamp-2 min-h-[2.625rem]">
          {title}
        </h3>
        <p className="mt-1 text-caption-12 text-text-secondary truncate">
          {channel}
        </p>
      </div>
    </article>
  );
}
