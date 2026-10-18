import type { MetadataRoute } from "next";
import { articleSitemapEntries } from "@/lib/sitemap";

/**
 * 1분마다 다시 만들 수 있다. 서버 익명 조회 캐시(`apiFetch`, 60초)와 같은 값이다.
 */
export const revalidate = 60;

/**
 * 아티클 sitemap — `/article/sitemap.xml`. 색인 게이트가 닫혀 있으면 빈 목록이고 색인 파일에도
 * 올리지 않는다. 4만 건을 넘으면 `generateSitemaps` 로 나눈다(id 는 Promise<string>).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return articleSitemapEntries();
}
