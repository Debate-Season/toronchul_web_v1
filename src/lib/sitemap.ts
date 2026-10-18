/**
 * 엔티티별 sitemap 의 공용 데이터 (PRD v0.9.0 §6.2).
 *
 * 백엔드 사이트맵 피드(PR #217)를 쓴다 — 노출 대상만, "id + 수정 시각" 을 커서 페이지로
 * 준다. 이슈마다 상세를 부르던 N+1 을 없앴고, lastmod 가 생성일이 아니라 실제 시각이 됐다.
 * - 이슈 `updatedAt` = max(이슈 생성·수정, 노출 토론 주제 추가, 위키 게시)
 * - 토론 `lastActivityAt` = 마지막 채팅 시각, 없으면 생성 시각
 *
 * 백엔드가 응답하지 않아도 빌드를 깨지 않는다. 빈 목록을 내보내고 다음 재생성에서 채운다.
 */
import type { MetadataRoute } from "next";
import { fetchAllSitemapIssues, fetchAllSitemapThreads } from "@/lib/api/sitemapFeed";
import { debateHref, issueHref } from "@/lib/routes";
import { absoluteUrl, seoulToIso } from "@/lib/seo";

type SitemapEntries = MetadataRoute.Sitemap;

function entry(path: string, modified: string): SitemapEntries[number] {
  return { url: absoluteUrl(path), lastModified: seoulToIso(modified) };
}

export async function issueSitemapEntries(): Promise<SitemapEntries> {
  try {
    const items = await fetchAllSitemapIssues();
    return items.map((item) => entry(issueHref(item.issueId), item.updatedAt));
  } catch (err) {
    console.error("[sitemap] 이슈 피드 조회 실패", err);
    return [];
  }
}

export async function debateSitemapEntries(): Promise<SitemapEntries> {
  try {
    const items = await fetchAllSitemapThreads();
    return items.map((item) => entry(debateHref(item.threadId), item.lastActivityAt));
  } catch (err) {
    console.error("[sitemap] 토론 주제 피드 조회 실패", err);
    return [];
  }
}
