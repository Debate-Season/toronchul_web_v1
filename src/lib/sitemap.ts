/**
 * 엔티티별 sitemap 의 공용 데이터 (PRD v0.9.0 §6.2).
 *
 * 지금은 이슈 목록을 받은 뒤 이슈마다 상세를 불러 토론 주제와 생성일을 얻는다(N+1).
 * 이슈가 수십 건일 때만 성립한다 — 백엔드에 "id + 수정 시각" 페이지 목록 API 를
 * 요청해 두었고(§7-3), 오면 이 파일만 그것으로 바꾼다.
 *
 * 백엔드가 응답하지 않아도 빌드를 깨지 않는다. 받은 만큼만 내보내고 다음
 * 재생성(`revalidate`)에서 채운다.
 */
import type { MetadataRoute } from "next";
import { fetchIssueDetail, isIndexableIssueStatus } from "@/lib/api/issue";
import { fetchIssueMap } from "@/lib/api/issueMap";
import { absoluteUrl, laterOf, seoulToIso } from "@/lib/seo";

export interface SitemapIssue {
  issueId: number;
  /** 이슈 생성일과 가장 늦게 생긴 토론 주제의 생성일 중 늦은 쪽 — API 가 주는 정확한 시각은 생성일뿐이다 */
  lastModified: string;
  threads: { threadId: number; createdAt: string }[];
}

/** 노출 대상(PUBLISHED·DORMANT) 이슈와 그 토론 주제 */
export async function loadSitemapIssues(): Promise<SitemapIssue[]> {
  let issues: Awaited<ReturnType<typeof fetchIssueMap>>;
  try {
    issues = await fetchIssueMap();
  } catch (err) {
    console.error("[sitemap] 이슈 목록 조회 실패", err);
    return [];
  }

  const results = await Promise.allSettled(
    issues
      .filter((issue) => isIndexableIssueStatus(issue.status))
      .map(async (issue) => ({ issue, detail: await fetchIssueDetail(issue.issueId) })),
  );

  const out: SitemapIssue[] = [];
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[sitemap] 이슈 상세 조회 실패", result.reason);
      continue;
    }
    const { issue, detail } = result.value;
    if (!detail.title || !isIndexableIssueStatus(detail.status)) continue;
    out.push({
      issueId: issue.issueId,
      lastModified: detail.chatRoomMap.reduce(
        (acc, room) => laterOf(acc, room.createdAt) ?? acc,
        issue.createdAt,
      ),
      threads: detail.chatRoomMap.map((room) => ({
        threadId: room.chatRoomId,
        createdAt: room.createdAt,
      })),
    });
  }
  return out;
}

/** 경로·백엔드 시각 → sitemap 항목 */
export function sitemapEntry(path: string, modified: string): MetadataRoute.Sitemap[number] {
  return { url: absoluteUrl(path), lastModified: seoulToIso(modified) };
}
