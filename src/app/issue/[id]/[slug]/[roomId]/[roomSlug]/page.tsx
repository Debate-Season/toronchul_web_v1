"use client";

import { useParams } from "next/navigation";
import RoomDetail from "@/components/room/RoomDetail";
import { fromBase36, issueHref } from "@/lib/slug";

/** 이슈 하위 토론방 상세 (/issue/[id]/[slug]/[roomId]/[roomSlug]). */
export default function IssueRoomPage() {
  const { id, slug, roomId } = useParams<{
    id: string;
    slug: string;
    roomId: string;
    roomSlug: string;
  }>();

  const backHref = issueHref(fromBase36(id), decodeURIComponent(slug));

  return (
    <RoomDetail
      roomId={fromBase36(roomId)}
      backHref={backHref}
      backLabel="이슈로 돌아가기"
    />
  );
}
