"use client";

import { useParams } from "next/navigation";
import DebateRoom from "@/components/room/DebateRoom";
import { fromBase36 } from "@/lib/slug";

/**
 * 토론방 — `/issue/[id]/[slug]/[threadId]/[threadSlug]`.
 *
 * 토론방은 이슈당 하나이고, 경로 끝의 토론 주제(스레드)가 열릴 탭을 결정한다.
 * `[threadSlug]` 는 읽기용이라 렌더에 쓰지 않는다(제목이 바뀌어도 링크가 살아야 함).
 */
export default function DebateRoomPage() {
  const { id, threadId } = useParams<{
    id: string;
    slug: string;
    threadId: string;
    threadSlug: string;
  }>();

  return (
    <DebateRoom issueId={fromBase36(id)} threadId={fromBase36(threadId)} />
  );
}
