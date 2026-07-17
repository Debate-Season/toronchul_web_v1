"use client";

import { useParams } from "next/navigation";
import ChatRoom from "@/components/room/ChatRoom";

/** 토론방 채팅 화면 (입장하기 목적지). */
export default function RoomChatPage() {
  const { id } = useParams<{ id: string }>();
  return <ChatRoom roomId={Number(id)} />;
}
