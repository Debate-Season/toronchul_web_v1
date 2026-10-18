import type { MetadataRoute } from "next";
import { fetchIssueDetail, isIndexableIssueStatus } from "@/lib/api/issue";
import { fetchIssueMap } from "@/lib/api/issueMap";
import { debateHref, issueHref } from "@/lib/routes";
import { absoluteUrl, laterOf, seoulToIso } from "@/lib/seo";

/** 한 시간마다 다시 만든다. 이슈·토론 추가가 이 주기로 반영된다 */
export const revalidate = 3600;

/**
 * 홈·이슈맵의 lastmod. **빌드 시각(`new Date()`)을 쓰면 안 된다** — 배포마다 전 URL 이
 * "방금 수정됨" 이 되어 Google 이 lastmod 신호를 믿지 않게 된다(PRD §6.2).
 * 두 페이지의 구조가 실제로 바뀌었을 때만 이 값을 올린다.
 */
const STATIC_LAST_MODIFIED = "2026-10-19T00:00:00+09:00";

/**
 * sitemap.xml (PRD v0.9.0 §6.2). URL 이 수십 개라 단일 파일이다.
 *
 * lastmod 는 실제 데이터 시각만 쓴다. 지금 API 가 주는 정확한 시각은 생성일뿐이다 —
 * 이슈는 "이슈 생성일과 가장 늦게 생긴 토론 주제의 생성일 중 늦은 쪽", 토론은 생성일.
 * `ChatRoomResponse.updatedAt` 은 이관 때 갱신되지 않아 쓰지 않는다(§6.2). 최종 채팅
 * 시각은 백엔드 요청 중(§7-3).
 *
 * 백엔드가 응답하지 않아도 빌드를 깨지 않는다. 그때는 받은 만큼만 내보내고 다음
 * 재생성(`revalidate`)에서 채운다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: STATIC_LAST_MODIFIED },
    { url: absoluteUrl("/map"), lastModified: STATIC_LAST_MODIFIED },
  ];

  let issues: Awaited<ReturnType<typeof fetchIssueMap>> = [];
  try {
    issues = await fetchIssueMap();
  } catch (err) {
    console.error("[sitemap] 이슈 목록 조회 실패", err);
    return entries;
  }

  const details = await Promise.allSettled(
    issues
      .filter((issue) => isIndexableIssueStatus(issue.status))
      .map(async (issue) => ({ issue, detail: await fetchIssueDetail(issue.issueId) })),
  );

  for (const result of details) {
    if (result.status === "rejected") {
      console.error("[sitemap] 이슈 상세 조회 실패", result.reason);
      continue;
    }
    const { issue, detail } = result.value;
    if (!detail.title || !isIndexableIssueStatus(detail.status)) continue;

    const issueModified = detail.chatRoomMap.reduce(
      (acc, room) => laterOf(acc, room.createdAt) ?? acc,
      issue.createdAt,
    );
    entries.push({
      url: absoluteUrl(issueHref(issue.issueId)),
      lastModified: seoulToIso(issueModified),
    });
    for (const room of detail.chatRoomMap) {
      entries.push({
        url: absoluteUrl(debateHref(room.chatRoomId)),
        lastModified: seoulToIso(room.createdAt),
      });
    }
  }

  return entries;
}
