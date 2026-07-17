"use client";

import { useParams } from "next/navigation";
import RoomDetail from "@/components/room/RoomDetail";

/** 독립 토론방 상세 (/room/[id]). 홈 찬반토론 등에서 진입. */
export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  return <RoomDetail roomId={Number(id)} backHref="/" backLabel="홈으로" />;
}
