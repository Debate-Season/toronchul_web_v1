import { absoluteUrl } from "@/lib/seo";

/**
 * 사이트맵 색인 — `/sitemap-index.xml` (PRD v0.9.0 §6.2).
 *
 * Next 는 색인 파일을 만들지 않으므로 직접 낸다. 검색엔진에는 이 파일 하나만 제출하고
 * (robots.txt `Sitemap:`), 엔티티가 늘면 여기에 줄을 더한다. 아티클처럼
 * `generateSitemaps` 로 나뉘는 종류는 샤드 수만큼 `/article/sitemap/{n}.xml` 을 넣는다.
 *
 * 하위 파일의 `lastmod` 는 생략한다(선택 항목). 넣으려면 하위 파일과 같은 데이터를
 * 다시 받아야 하는데, 틀린 값을 내느니 비우는 편이 낫다.
 */
const CHILD_SITEMAPS = ["/sitemap.xml", "/issue/sitemap.xml", "/debate/sitemap.xml"];

export const dynamic = "force-static";

export function GET(): Response {
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...CHILD_SITEMAPS.map((path) => `  <sitemap><loc>${absoluteUrl(path)}</loc></sitemap>`),
    "</sitemapindex>",
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
