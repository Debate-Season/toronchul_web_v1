"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { RoomThread } from "@/lib/api/room";
import { threadHref } from "@/lib/slug";

interface ThreadTabsProps {
  issueId: number;
  issueTitle: string;
  threads: RoomThread[];
  selectedThreadId: number;
}

/**
 * 토론방 상단의 토론 주제(스레드) 탭. 탭 = 링크라서 주소창이 항상 현재 주제를
 * 가리킨다. `replace` 를 쓰는 이유는 탭을 여러 번 옮긴 뒤 뒤로가기를 눌렀을 때
 * 지나온 탭을 하나씩 되짚지 않고 이슈로 나가게 하기 위함이다.
 */
export default function ThreadTabs({
  issueId,
  issueTitle,
  threads,
  selectedThreadId,
}: ThreadTabsProps) {
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  // 주제 목록에서 바로 들어오면 선택된 탭이 스크롤 밖에 있을 수 있다
  // (목록은 최신순인데 진입 주제는 아무거나). 가로 스크롤만 맞추고
  // 페이지 세로 위치는 건드리지 않는다.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selectedThreadId]);

  return (
    <div
      role="tablist"
      aria-label="토론 주제"
      // 가로 스크롤바는 숨긴다 — 탭이 잘린 것 자체가 스크롤 힌트이고,
      // 막대가 탭과 대화 사이에 회색 줄로 끼어들어 경계를 흐린다.
      className="scrollbar-none flex flex-shrink-0 gap-2 overflow-x-auto pb-3"
    >
      {threads.map((thread) => {
        const active = thread.threadId === selectedThreadId;
        return (
          <Link
            key={thread.threadId}
            ref={active ? activeRef : null}
            href={threadHref(issueId, issueTitle, thread.threadId, thread.title)}
            replace
            role="tab"
            aria-selected={active}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-body-14 font-medium transition-colors ${
              active
                ? "bg-brand text-white"
                : "bg-grey-90 text-text-secondary hover:opacity-90"
            }`}
          >
            {thread.title}
          </Link>
        );
      })}
    </div>
  );
}
