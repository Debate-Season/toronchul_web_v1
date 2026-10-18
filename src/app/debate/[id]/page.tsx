import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { fetchIssueRoom, fetchRoomDetail, type RoomDetailResponse } from "@/lib/api/room";
import { debateHref, issueHref, parseEntityId } from "@/lib/routes";
import {
  SITE_NAME,
  breadcrumbJsonLd,
  buildMetadata,
  debateJsonLd,
  toDescription,
} from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import DebateRoom from "@/components/room/DebateRoom";

/** 색인·노출 대상인 방 상태. HIDDEN·DELETED 는 백엔드가 200 으로 주지만 404 로 낸다 */
const VISIBLE_STATUSES = new Set(["OPEN", "CLOSED"]);

type Params = { params: Promise<{ id: string }> };

/**
 * 경로 판정 + 스레드 단건 조회. `generateMetadata` 와 페이지가 같은 요청 안에서 한 번만
 * 부른다. 경로에 상위 이슈가 없으므로 여기서 `issueId` 를 찾는다. 컨테이너 방 id 도 같은
 * 엔드포인트가 200 으로 돌려주므로 `roomType` 으로 걸러 404 를 낸다.
 * SSR 호출은 토큰 없이 한다 — `apiFetch` 의 401 분기가 브라우저 전용이다.
 */
const loadThread = cache(async (segment: string): Promise<{
  threadId: number;
  room: RoomDetailResponse;
}> => {
  const parsed = parseEntityId(segment);
  if (!parsed) notFound();
  if (parsed.segment !== segment) permanentRedirect(debateHref(parsed.id));

  const room = await fetchRoomDetail(parsed.id).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });
  if (room.roomType !== "THREAD" || !VISIBLE_STATUSES.has(room.status)) {
    notFound();
  }
  return { threadId: parsed.id, room };
});

/** 화면의 찬반 패널과 같은 정보를 문장으로 */
function stanceSentence(room: RoomDetailResponse): string {
  return `찬성 ${room.agree} · 반대 ${room.disagree}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const { threadId, room } = await loadThread(id);
  return buildMetadata({
    title: room.title,
    description: toDescription(
      `${room.title} — ${stanceSentence(room)}. "${room.issueTitle}" 이슈의 토론 주제입니다. ${SITE_NAME}에서 찬반 의견을 나눠 보세요.`,
    ),
    path: debateHref(threadId),
    type: "article",
  });
}

/**
 * 토론 상세 — `/debate/{b36}` (PRD v0.9.0 §4.2, §5.3).
 *
 * 레거시 4단 경로는 `next.config.ts` 의 redirects 가 이 경로로 넘긴다. 방 정보(주제 탭·
 * 찬반 패널)는 서버가 받아 둔 값으로 첫 렌더부터 그린다. 채팅 내역은 아직 익명 조회가
 * 401 이라(§7-1) 크롤러에게 보이지 않는다.
 */
export default async function DebatePage({ params }: Params) {
  const { id } = await params;
  const { threadId, room } = await loadThread(id);
  // 실패해도 클라이언트가 다시 받는다
  const issueRoom = await fetchIssueRoom(room.issueId).catch(() => undefined);

  const path = debateHref(threadId);
  const issuePath = issueHref(room.issueId);

  return (
    <>
      <JsonLd
        data={debateJsonLd({
          path,
          title: room.title,
          text: `${room.title} (${stanceSentence(room)})`,
          datePublished: room.createdAt,
          votes: room.agree + room.disagree,
          issuePath,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: SITE_NAME, path: "/" },
          { name: room.issueTitle, path: issuePath },
          { name: room.title, path },
        ])}
      />
      {/* key — 다른 이슈의 토론으로 클라이언트 이동하면 다시 마운트한다. 같은 이슈 안의 탭 이동은 유지 */}
      <DebateRoom
        key={room.issueId}
        issueId={room.issueId}
        threadId={threadId}
        initialData={issueRoom}
      />
    </>
  );
}
