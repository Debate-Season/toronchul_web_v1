"use client";

import { MessagesSquare } from "lucide-react";
import type { RoomThread } from "@/lib/api/room";
import ThreadVoteBar from "@/components/room/ThreadVoteBar";

interface ThreadPanelProps {
  thread: RoomThread;
  /** 투표 성공 후 스레드 목록 재조회 트리거 */
  onVoted: () => void;
}

/**
 * 지금 보고 있는 토론 주제 + 찬반 현황 + 투표. **우측 사이드바에 놓인다.**
 *
 * 대화 위(본문)가 아니라 사이드바인 이유: 토론방 본문은 대화가 주인공이고,
 * 주제·찬반은 계속 참조하지만 스크롤과 함께 밀려서는 안 되는 정보다. 본문에
 * 얹으면 대화 높이를 그만큼 먹는다.
 *
 * 사이드바가 없는 모바일(`md` 미만)에서는 같은 패널이 본문 상단에 렌더된다 —
 * 안 그러면 투표 자체에 닿을 수 없다. 두 자리 중 **CSS 로 한쪽만 표시**되므로
 * 보조기술에도 하나만 노출된다.
 */
export default function ThreadPanel({ thread, onVoted }: ThreadPanelProps) {
  return (
    <section
      aria-label="토론 주제"
      className="flex flex-col gap-3 rounded-xl border border-border p-4"
    >
      <div className="flex items-start gap-2">
        <MessagesSquare
          size={18}
          className="mt-0.5 flex-shrink-0 text-brand"
          aria-hidden="true"
        />
        <h1 className="text-body-16 font-bold text-text-primary">
          {thread.title}
        </h1>
      </div>

      <ThreadVoteBar
        threadId={thread.threadId}
        agreeCount={thread.agreeCount}
        disagreeCount={thread.disagreeCount}
        myOpinion={thread.myOpinion}
        onVoted={onVoted}
      />
    </section>
  );
}
