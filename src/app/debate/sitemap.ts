import type { MetadataRoute } from "next";
import { debateHref } from "@/lib/routes";
import { loadSitemapIssues, sitemapEntry } from "@/lib/sitemap";

/**
 * 1분마다 다시 만들 수 있다. 서버 익명 조회 캐시(`apiFetch`, 60초)와 같은 값이라 페이지와
 * 같은 캐시를 함께 쓴다 — 더 길게 잡아도 fetch 캐시가 짧으면 Next 가 그쪽을 따른다.
 */
export const revalidate = 60;

/**
 * 토론 주제 sitemap — `/debate/sitemap.xml`. lastmod 는 생성일이다 — 최종 채팅 시각은
 * 백엔드 요청 중(PRD §7-3). 4만 건을 넘으면 `generateSitemaps` 로 나눈다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const issues = await loadSitemapIssues();
  return issues.flatMap((issue) =>
    issue.threads.map((thread) => sitemapEntry(debateHref(thread.threadId), thread.createdAt)),
  );
}
