import { apiFetch } from "./client";
import type { BestIssueRoom } from "@/components/home/IssueCardNew";
import type { ChatRoomResponse } from "@/components/home/IssueCard";

// ── 핫한 토론 주제 (베스트 이슈) ─────────────────
export async function fetchBestIssues(
  token?: string | null,
): Promise<BestIssueRoom[]> {
  return apiFetch<BestIssueRoom[]>("/api/v2/issues/best", { token });
}

// ── 실시간 토론장 (채팅방 목록) ──────────────────
export async function fetchChatRooms(
  token?: string | null,
): Promise<ChatRoomResponse[]> {
  return apiFetch<ChatRoomResponse[]>("/api/v2/chatrooms", { token });
}

// ── 실시간 핫한 토론 (사이드바용 인기 주제) ──────
export interface TrendingTopic {
  rank: number;
  title: string;
  comments: number;
}

export async function fetchTrendingTopics(
  token?: string | null,
): Promise<TrendingTopic[]> {
  return apiFetch<TrendingTopic[]>("/api/v2/issues/trending", { token });
}
