import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * robots.txt (PRD v0.9.0 §6.3).
 *
 * 모든 봇이 **같은 그룹**을 쓴다. 이름을 따로 둔 봇은 `*` 그룹을 무시하고 자기
 * 그룹만 읽으므로, 봇별 그룹을 나누면 그 봇에게는 아래 Disallow 가 사라진다.
 * Yeti(Naver)·Daumoa 는 이름으로 명시한다(§9.3 [P0]).
 *
 * AI 학습 봇(GPTBot·ClaudeBot·CCBot 등)의 차단 여부는 SEO 가 아니라 라이선스 결정이고
 * 아직 정해지지 않았다(§7-9). 결정 전까지는 robots.txt 가 없던 때와 같은 "허용" 을
 * 유지한다 — 정해지면 별도 그룹으로 `disallow: "/"` 를 추가한다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: ["*", "Googlebot", "Bingbot", "Yeti", "Daumoa"],
      allow: "/",
      disallow: [
        "/api/", // Route Handler (OAuth 콜백 등)
        "/proxy/", // 브라우저 → 백엔드 API 프록시
        "/prod/", // 구버전 앱 REST 안전망 프록시
        "/relay/", // PostHog 리버스 프록시 — 크롤러가 두드리면 분석 데이터 오염
        "/oauth/",
        "/login",
        "/settings",
        "/profile",
        "/onboarding",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
