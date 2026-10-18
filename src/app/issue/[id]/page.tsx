import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import {
  fetchIssueDetail,
  isIndexableIssueStatus,
  type IssueDetailResponse,
} from "@/lib/api/issue";
import { fetchIssueMap } from "@/lib/api/issueMap";
import { fetchIssueRoom } from "@/lib/api/room";
import { issueHref, parseEntityId } from "@/lib/routes";
import {
  SITE_NAME,
  breadcrumbJsonLd,
  buildMetadata,
  issueJsonLd,
  laterOf,
  toDescription,
} from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import IssueDetailView from "./IssueDetailView";

type Params = { params: Promise<{ id: string }> };

/**
 * 경로 판정 + 이슈 조회. `generateMetadata` 와 페이지가 같은 요청 안에서 한 번만 부른다.
 * SSR 호출은 토큰 없이 한다 — `apiFetch` 의 401 분기가 브라우저 전용이다.
 */
const loadIssue = cache(async (segment: string): Promise<{
  issueId: number;
  detail: IssueDetailResponse;
}> => {
  const parsed = parseEntityId(segment);
  if (!parsed) notFound();
  if (parsed.segment !== segment) permanentRedirect(issueHref(parsed.id));

  const detail = await fetchIssueDetail(parsed.id).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });
  // 없는 이슈를 200 + title null 로 주던 시절과 404 를 주는 시절(백엔드 PR #215) 모두 대응
  if (!detail.title || !isIndexableIssueStatus(detail.status)) notFound();
  return { issueId: parsed.id, detail };
});

/** 이슈 생성일은 상세 응답에 없어 목록에서 찾는다. 실패해도 페이지는 그린다 */
const loadIssueCreatedAt = cache(async (issueId: number) => {
  const list = await fetchIssueMap().catch(() => []);
  return list.find((issue) => issue.issueId === issueId)?.createdAt;
});

function describe(detail: IssueDetailResponse): string {
  const topics = detail.chatRoomMap.map((room) => room.title);
  if (topics.length === 0) {
    return toDescription(`${detail.title} — ${SITE_NAME}에서 이 이슈의 토론을 확인하세요.`);
  }
  // 주제는 대개 물음표로 끝난다 — 마침표를 덧붙여 "?." 가 되지 않게
  const list = topics.join(" · ");
  const end = /[.?!]$/.test(list) ? "" : ".";
  return toDescription(
    `${detail.title} 이슈의 토론 주제 ${topics.length}개: ${list}${end} 주제별 찬반 현황을 확인하고 의견을 남겨 보세요.`,
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const { issueId, detail } = await loadIssue(id);
  return buildMetadata({
    title: detail.title,
    description: describe(detail),
    path: issueHref(issueId),
    type: "article",
  });
}

/**
 * 이슈 상세 — `/issue/{b36}` (PRD v0.9.0 §4.2, §5.1).
 *
 * 본문은 서버가 받아 둔 데이터로 첫 렌더부터 그린다(크롤러가 읽는 HTML). 대문자는
 * 308 으로 소문자형에, 별칭·잘못된 문자·없는 이슈·미노출 상태는 404. 레거시
 * `/issue/{b36}/{slug}` 는 `next.config.ts` 의 redirects 가 이 경로로 넘긴다.
 */
export default async function IssuePage({ params }: Params) {
  const { id } = await params;
  const { issueId, detail } = await loadIssue(id);
  const [room, createdAt] = await Promise.all([
    // 토론 주제 목록은 없어도 페이지가 성립한다 — 실패하면 클라이언트가 다시 받는다
    fetchIssueRoom(issueId).catch(() => undefined),
    loadIssueCreatedAt(issueId),
  ]);

  const path = issueHref(issueId);
  // 실제 수정 시각이 API 에 없어, 가장 늦게 생긴 토론 주제의 생성일을 쓴다(§6.2)
  const dateModified = detail.chatRoomMap.reduce(
    (acc, room) => laterOf(acc, room.createdAt),
    createdAt,
  );

  return (
    <>
      <JsonLd
        data={issueJsonLd({
          path,
          title: detail.title,
          description: describe(detail),
          datePublished: createdAt,
          dateModified,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: SITE_NAME, path: "/" },
          { name: detail.title, path },
        ])}
      />
      {/* key — 다른 이슈로 클라이언트 이동하면 상태를 버리고 새 초기 데이터로 다시 마운트한다 */}
      <IssueDetailView
        key={issueId}
        issueId={issueId}
        initialData={detail}
        initialRoom={room}
      />
    </>
  );
}
