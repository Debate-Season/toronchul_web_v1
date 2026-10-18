import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * 정적 페이지 sitemap — `/sitemap.xml` (PRD v0.9.0 §6.2).
 *
 * 엔티티는 종류별 파일로 나눴다(`/issue/sitemap.xml`, `/debate/sitemap.xml`). 묶음은
 * `/sitemap-index.xml` 이 가리키고, 검색엔진에는 그 색인 하나만 제출한다. 파일을
 * 나누면 Search Console 에서 종류별 색인율이 따로 보인다.
 *
 * lastmod 에 빌드 시각을 쓰면 안 된다 — 배포마다 전 URL 이 "방금 수정됨" 이 되어
 * Google 이 lastmod 신호를 믿지 않게 된다. 두 페이지의 구조가 실제로 바뀌었을 때만 올린다.
 */
const STATIC_LAST_MODIFIED = "2026-10-19T00:00:00+09:00";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), lastModified: STATIC_LAST_MODIFIED },
    { url: absoluteUrl("/map"), lastModified: STATIC_LAST_MODIFIED },
  ];
}
